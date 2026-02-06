/**
 * Notification Service
 * Handles in-app and WhatsApp notifications for team and clients
 */

import { db } from '@/lib/db';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import { sendWhatsAppMessage, type WhatsAppTemplate } from './whatsapp';

// Notification creation types
interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  channels?: NotificationChannel[];
  userId?: string;
  clientId?: string;
  projectId?: string;
  taskId?: string;
  shipmentId?: string;
  invoiceId?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationResult {
  id: string;
  channels: {
    channel: NotificationChannel;
    status: 'sent' | 'failed' | 'pending';
    error?: string;
  }[];
}

/**
 * Create and send a notification
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationResult> {
  const channels = input.channels || ['IN_APP'];
  const results: NotificationResult['channels'] = [];

  // Create in-app notification record
  const notification = await db.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      channel: channels[0] ?? 'IN_APP', // Primary channel
      status: 'PENDING',
      userId: input.userId,
      clientId: input.clientId,
      projectId: input.projectId,
      taskId: input.taskId,
      shipmentId: input.shipmentId,
      invoiceId: input.invoiceId,
      metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
    },
  });

  // Process each channel
  for (const channel of channels) {
    try {
      switch (channel) {
        case 'IN_APP':
          // In-app notifications are stored, mark as sent
          results.push({ channel, status: 'sent' });
          break;

        case 'WHATSAPP':
          // Send WhatsApp if we have a phone number
          const phoneNumber = await getRecipientPhone(input.userId, input.clientId);
          if (phoneNumber) {
            const whatsappResult = await sendWhatsAppNotification(
              phoneNumber,
              input.type,
              input.title,
              input.message,
              input.metadata
            );
            results.push({
              channel,
              status: whatsappResult.success ? 'sent' : 'failed',
              error: whatsappResult.error,
            });
          } else {
            results.push({
              channel,
              status: 'failed',
              error: 'No phone number available',
            });
          }
          break;

        case 'EMAIL':
          // Email notifications - placeholder for future
          results.push({ channel, status: 'pending' });
          break;

        case 'SMS':
          // SMS notifications - placeholder for future
          results.push({ channel, status: 'pending' });
          break;
      }
    } catch (error) {
      results.push({
        channel,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update notification status based on results
  const allSent = results.every((r) => r.status === 'sent');
  const anySent = results.some((r) => r.status === 'sent');

  await db.notification.update({
    where: { id: notification.id },
    data: {
      status: allSent ? 'SENT' : anySent ? 'SENT' : 'FAILED',
      sentAt: anySent ? new Date() : null,
    },
  });

  return {
    id: notification.id,
    channels: results,
  };
}

/**
 * Get recipient phone number from user or client
 */
async function getRecipientPhone(
  userId?: string,
  clientId?: string
): Promise<string | null> {
  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    return user?.phone || null;
  }

  if (clientId) {
    const client = await db.client.findUnique({
      where: { id: clientId },
      select: { whatsappNumber: true, phone: true },
    });
    return client?.whatsappNumber || client?.phone || null;
  }

  return null;
}

/**
 * Send WhatsApp notification based on type
 */
async function sendWhatsAppNotification(
  phoneNumber: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  // Map notification type to WhatsApp template
  const templateMap: Partial<Record<NotificationType, WhatsAppTemplate>> = {
    TASK_ASSIGNED: 'task_assigned',
    TASK_DUE_SOON: 'task_reminder',
    PAYMENT_REQUEST: 'payment_request',
    SHIPMENT_ARRIVAL: 'shipment_update',
    SHIPMENT_RELEASED: 'shipment_released',
    SHIPMENT_DELIVERED: 'shipment_delivered',
  };

  const template = templateMap[type];
  if (!template) {
    // Send as plain message if no template
    return sendWhatsAppMessage({
      to: phoneNumber,
      message: `${title}\n\n${message}`,
    });
  }

  // Send templated message
  return sendWhatsAppMessage({
    to: phoneNumber,
    template,
    parameters: {
      title,
      message,
      ...(metadata as Record<string, string>),
    },
  });
}

// ============================================
// Notification Query Functions
// ============================================

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string) {
  return db.notification.findMany({
    where: {
      userId,
      readAt: null,
      status: { not: 'FAILED' },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  limit = 50,
  includeRead = true
) {
  return db.notification.findMany({
    where: {
      userId,
      ...(includeRead ? {} : { readAt: null }),
      status: { not: 'FAILED' },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
  return db.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string) {
  return db.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(userId: string) {
  return db.notificationPreference.findUnique({
    where: { userId },
  });
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Record<string, NotificationChannel[]>
) {
  return db.notificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      preferences: preferences as object,
    },
    update: {
      preferences: preferences as object,
    },
  });
}

// ============================================
// Pre-built Notification Helpers
// ============================================

/**
 * Send task assignment notification
 */
export async function notifyTaskAssigned(
  taskId: string,
  assignedToUserId: string,
  taskTitle: string,
  projectName?: string
) {
  return createNotification({
    type: 'TASK_ASSIGNED',
    title: 'New Task Assigned',
    message: `You have been assigned: ${taskTitle}${projectName ? ` (${projectName})` : ''}`,
    channels: ['IN_APP', 'WHATSAPP'],
    userId: assignedToUserId,
    taskId,
    metadata: { taskTitle, projectName },
  });
}

/**
 * Send payment request notification to client
 */
export async function notifyPaymentRequest(
  clientId: string,
  invoiceId: string,
  invoiceNumber: string,
  amount: number,
  currency: string,
  shipmentId?: string
) {
  return createNotification({
    type: 'PAYMENT_REQUEST',
    title: 'Payment Request',
    message: `Invoice ${invoiceNumber} for ${amount.toLocaleString()} ${currency} is ready for payment.`,
    channels: ['IN_APP', 'WHATSAPP'],
    clientId,
    invoiceId,
    shipmentId,
    metadata: { invoiceNumber, amount, currency },
  });
}

/**
 * Send shipment milestone notification to client
 */
export async function notifyShipmentMilestone(
  clientId: string,
  shipmentId: string,
  milestone: 'arrival' | 'cleared' | 'released' | 'delivered',
  trackingNumber: string,
  message?: string
) {
  type Milestone = typeof milestone;
  const typeMap: Record<Milestone, NotificationType> = {
    arrival: 'SHIPMENT_ARRIVAL',
    cleared: 'SHIPMENT_CLEARED',
    released: 'SHIPMENT_RELEASED',
    delivered: 'SHIPMENT_DELIVERED',
  };

  const titleMap: Record<Milestone, string> = {
    arrival: 'Shipment Arrived',
    cleared: 'Shipment Cleared',
    released: 'Shipment Released',
    delivered: 'Shipment Delivered',
  };

  const defaultMessages: Record<Milestone, string> = {
    arrival: `Your shipment ${trackingNumber} has arrived at port.`,
    cleared: `Your shipment ${trackingNumber} has been cleared by customs.`,
    released: `Your shipment ${trackingNumber} has been released.`,
    delivered: `Your shipment ${trackingNumber} has been delivered.`,
  };

  return createNotification({
    type: typeMap[milestone],
    title: titleMap[milestone],
    message: message || defaultMessages[milestone],
    channels: ['IN_APP', 'WHATSAPP'],
    clientId,
    shipmentId,
    metadata: { trackingNumber, milestone },
  });
}

export * from './whatsapp';
export * from './templates';
