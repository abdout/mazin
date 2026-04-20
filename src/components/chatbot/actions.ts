'use server';

import { createGroq } from '@ai-sdk/groq';
import { generateText, type ModelMessage } from 'ai';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  buildSystemPrompt,
  type MazinChatbotContext,
  type PlatformChatbotData,
  type PromptType,
  type TrackingChatbotData,
} from './prompts';

const log = logger.forModule('chatbot');

const MAX_MESSAGES = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_AUTH = 10;
const RATE_LIMIT_MAX_ANON = 5;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const DAILY_LIMIT_AUTH = 100;
const DAILY_LIMIT_ANON = 30;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const dailyLimitMap = new Map<string, { count: number; resetAt: number }>();

async function getRequesterId(userId?: string): Promise<{ id: string; isAuthed: boolean }> {
  if (userId) return { id: `u:${userId}`, isAuthed: true };
  const h = await headers();
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'anon';
  return { id: `ip:${ip}`, isAuthed: false };
}

function checkRateLimit(
  id: string,
  isAuthed: boolean
): { allowed: boolean; error?: string } {
  const now = Date.now();
  const perMinute = isAuthed ? RATE_LIMIT_MAX_AUTH : RATE_LIMIT_MAX_ANON;
  const perDay = isAuthed ? DAILY_LIMIT_AUTH : DAILY_LIMIT_ANON;

  const daily = dailyLimitMap.get(id);
  if (daily && now < daily.resetAt && daily.count >= perDay) {
    return { allowed: false, error: 'Daily message limit reached. Please try again tomorrow.' };
  }

  const entry = rateLimitMap.get(id);
  if (entry && now < entry.resetAt) {
    if (entry.count >= perMinute) {
      return { allowed: false, error: 'Too many messages. Please wait a moment.' };
    }
    entry.count++;
  } else {
    rateLimitMap.set(id, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  if (daily && now < daily.resetAt) {
    daily.count++;
  } else {
    dailyLimitMap.set(id, { count: 1, resetAt: now + DAILY_WINDOW_MS });
  }

  return { allowed: true };
}

/**
 * Fetch a public tracking snapshot by tracking number/slug — safe for anonymous use.
 */
export async function getTrackingChatbotContext(
  identifier: string
): Promise<TrackingChatbotData | null> {
  if (!identifier) return null;
  try {
    const shipment = await db.shipment.findFirst({
      where: {
        publicTrackingEnabled: true,
        OR: [{ trackingNumber: identifier }, { trackingSlug: identifier }],
      },
      select: {
        trackingNumber: true,
        shipmentNumber: true,
        status: true,
        type: true,
        description: true,
        consignee: true,
        consignor: true,
        vesselName: true,
        containerNumber: true,
        arrivalDate: true,
        trackingStages: {
          select: { stageType: true, status: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!shipment || !shipment.trackingNumber) return null;

    const completed = shipment.trackingStages.filter(s => s.status === 'COMPLETED').length;
    const current = shipment.trackingStages.find(s => s.status === 'IN_PROGRESS')
      ?? shipment.trackingStages.find(s => s.status === 'PENDING');

    return {
      trackingNumber: shipment.trackingNumber,
      shipmentNumber: shipment.shipmentNumber,
      status: shipment.status,
      type: shipment.type,
      description: shipment.description,
      consignee: shipment.consignee,
      consignor: shipment.consignor,
      vesselName: shipment.vesselName,
      containerNumber: shipment.containerNumber,
      arrivalDate: shipment.arrivalDate,
      currentStageType: current?.stageType ?? null,
      currentStageStatus: current?.status ?? null,
      completedStages: completed,
      totalStages: shipment.trackingStages.length,
    };
  } catch (err) {
    log.error('Failed to fetch tracking context', err as Error);
    return null;
  }
}

/**
 * Fetch a platform project snapshot for authenticated users.
 */
export async function getPlatformChatbotContext(
  projectId: string
): Promise<PlatformChatbotData | null> {
  if (!projectId) return null;
  try {
    const session = await auth();
    if (!session?.user?.id) return null;

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        customer: true,
        blAwbNumber: true,
        status: true,
        portOfOrigin: true,
        portOfDestination: true,
        shipment: {
          select: {
            id: true,
            acds: { select: { status: true }, take: 1 },
            imForms: { select: { status: true }, take: 1 },
            declarations: {
              where: { status: { in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'] } },
              select: { id: true },
            },
            invoices: {
              where: { status: { in: ['SENT', 'OVERDUE'] } },
              select: { total: true },
            },
          },
        },
      },
    });

    if (!project) return null;

    const shipment = project.shipment;
    const unpaidTotal = shipment?.invoices.reduce(
      (sum, inv) => sum + Number(inv.total ?? 0),
      0
    );

    return {
      projectId: project.id,
      customer: project.customer,
      blAwbNumber: project.blAwbNumber,
      status: project.status,
      portOfOrigin: project.portOfOrigin,
      portOfDestination: project.portOfDestination,
      hasAcd: shipment ? shipment.acds.length > 0 : undefined,
      hasImForm: shipment ? shipment.imForms.length > 0 : undefined,
      openDeclarations: shipment?.declarations.length,
      unpaidInvoicesTotal: unpaidTotal,
    };
  } catch (err) {
    log.error('Failed to fetch platform context', err as Error);
    return null;
  }
}

interface SendMessageInput {
  messages: ModelMessage[];
  promptType?: PromptType;
  trackingIdentifier?: string;
  projectId?: string;
  locale?: string;
}

export async function sendMessage(input: SendMessageInput) {
  const session = await auth();
  const { id: requesterId, isAuthed } = await getRequesterId(session?.user?.id);

  const rate = checkRateLimit(requesterId, isAuthed);
  if (!rate.allowed) {
    return { success: false, error: rate.error };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'Chat service is not configured. Please contact support.',
    };
  }

  const {
    messages,
    promptType = 'marketing',
    trackingIdentifier,
    projectId,
    locale = 'en',
  } = input;

  try {
    // Resolve context lazily — only for prompt types that need DB data.
    const context: MazinChatbotContext = { promptType };
    if (promptType === 'tracking' && trackingIdentifier) {
      context.tracking = await getTrackingChatbotContext(trackingIdentifier);
    } else if (promptType === 'platform' && projectId) {
      context.platform = await getPlatformChatbotContext(projectId);
    }

    const systemPrompt = buildSystemPrompt(context, locale);
    const truncated = messages.slice(-MAX_MESSAGES);
    const groq = createGroq({ apiKey });

    const result = await generateText({
      model: groq('llama-3.1-8b-instant'),
      messages: truncated,
      system: systemPrompt,
    });

    return { success: true, content: result.text };
  } catch (error) {
    log.error('Chatbot generation failed', error as Error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    };
  }
}
