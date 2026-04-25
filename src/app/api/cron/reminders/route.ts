/**
 * Cron Endpoint for Task Reminders
 *
 * This endpoint should be called periodically (e.g., every hour) by a cron service
 * like Vercel Cron, Upstash QStash, or a traditional cron job.
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/reminders",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { runAllReminderJobs } from '@/lib/jobs/task-reminders';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const log = logger.forModule('api.cron-reminders');

const CRON_MONITOR_SLUG = 'cron-reminders-daily';
const CRON_SCHEDULE = { type: 'crontab' as const, value: '0 8 * * *' };

// Verify cron secret to prevent unauthorized access
function verifySecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // CRON_SECRET must be configured -- reject all requests without it
    return false;
  }

  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.replace('Bearer ', '');

  return bearerToken === cronSecret;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifySecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const checkInId = Sentry.captureCheckIn(
    { monitorSlug: CRON_MONITOR_SLUG, status: 'in_progress' },
    { schedule: CRON_SCHEDULE, checkinMargin: 5, maxRuntime: 10 }
  );

  try {
    const results = await runAllReminderJobs();

    Sentry.captureCheckIn({ checkInId, monitorSlug: CRON_MONITOR_SLUG, status: 'ok' });

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    log.error('Cron job failed', error as Error);
    Sentry.captureCheckIn({ checkInId, monitorSlug: CRON_MONITOR_SLUG, status: 'error' });
    Sentry.captureException(error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for webhook-based cron services
export async function POST(request: NextRequest) {
  return GET(request);
}
