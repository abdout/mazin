/**
 * Notification Templates
 * Pre-defined notification messages for various events
 */

import type { NotificationType } from '@prisma/client';

interface NotificationTemplate {
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
}

export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  // Task notifications
  TASK_ASSIGNED: {
    titleEn: 'New Task Assigned',
    titleAr: 'مهمة جديدة',
    messageEn: 'You have been assigned: {taskTitle}',
    messageAr: 'تم تعيينك لمهمة: {taskTitle}',
  },
  TASK_DUE_SOON: {
    titleEn: 'Task Due Soon',
    titleAr: 'المهمة قاربت على الانتهاء',
    messageEn: 'Task "{taskTitle}" is due in {hours} hours',
    messageAr: 'المهمة "{taskTitle}" مستحقة خلال {hours} ساعات',
  },
  TASK_OVERDUE: {
    titleEn: 'Task Overdue',
    titleAr: 'المهمة متأخرة',
    messageEn: 'Task "{taskTitle}" is overdue',
    messageAr: 'المهمة "{taskTitle}" متأخرة',
  },
  TASK_COMPLETED: {
    titleEn: 'Task Completed',
    titleAr: 'تم إكمال المهمة',
    messageEn: 'Task "{taskTitle}" has been completed',
    messageAr: 'تم إكمال المهمة "{taskTitle}"',
  },

  // Stage notifications
  STAGE_ATTENTION_NEEDED: {
    titleEn: 'Attention Required',
    titleAr: 'يتطلب انتباه',
    messageEn: 'Stage "{stageName}" requires attention for shipment {trackingNumber}',
    messageAr: 'المرحلة "{stageName}" تتطلب انتباه للشحنة {trackingNumber}',
  },
  STAGE_COMPLETED: {
    titleEn: 'Stage Completed',
    titleAr: 'تم إكمال المرحلة',
    messageEn: 'Stage "{stageName}" has been completed for shipment {trackingNumber}',
    messageAr: 'تم إكمال مرحلة "{stageName}" للشحنة {trackingNumber}',
  },

  // Shipment notifications
  SHIPMENT_CREATED: {
    titleEn: 'Shipment Created',
    titleAr: 'تم إنشاء الشحنة',
    messageEn: 'New shipment {trackingNumber} has been created',
    messageAr: 'تم إنشاء شحنة جديدة {trackingNumber}',
  },
  SHIPMENT_ARRIVAL: {
    titleEn: 'Shipment Arrived',
    titleAr: 'وصلت الشحنة',
    messageEn: 'Your shipment {trackingNumber} has arrived at Port Sudan',
    messageAr: 'وصلت شحنتك {trackingNumber} إلى ميناء بورتسودان',
  },
  SHIPMENT_CLEARED: {
    titleEn: 'Shipment Cleared',
    titleAr: 'تم تخليص الشحنة',
    messageEn: 'Shipment {trackingNumber} has been cleared by customs',
    messageAr: 'تم تخليص الشحنة {trackingNumber} من الجمارك',
  },
  SHIPMENT_RELEASED: {
    titleEn: 'Shipment Released',
    titleAr: 'تم الإفراج عن الشحنة',
    messageEn: 'Your shipment {trackingNumber} has been released',
    messageAr: 'تم الإفراج عن شحنتك {trackingNumber}',
  },
  SHIPMENT_DELIVERED: {
    titleEn: 'Shipment Delivered',
    titleAr: 'تم تسليم الشحنة',
    messageEn: 'Your shipment {trackingNumber} has been delivered',
    messageAr: 'تم تسليم شحنتك {trackingNumber}',
  },

  // Payment notifications
  PAYMENT_REQUEST: {
    titleEn: 'Payment Request',
    titleAr: 'طلب دفع',
    messageEn: 'Invoice {invoiceNumber} for {amount} {currency} is ready for payment',
    messageAr: 'الفاتورة {invoiceNumber} بمبلغ {amount} {currency} جاهزة للدفع',
  },
  PAYMENT_RECEIVED: {
    titleEn: 'Payment Received',
    titleAr: 'تم استلام الدفع',
    messageEn: 'Payment of {amount} {currency} received for invoice {invoiceNumber}',
    messageAr: 'تم استلام دفعة بمبلغ {amount} {currency} للفاتورة {invoiceNumber}',
  },
  PAYMENT_OVERDUE: {
    titleEn: 'Payment Overdue',
    titleAr: 'الدفع متأخر',
    messageEn: 'Invoice {invoiceNumber} is overdue. Amount: {amount} {currency}',
    messageAr: 'الفاتورة {invoiceNumber} متأخرة. المبلغ: {amount} {currency}',
  },

  // System notifications
  SYSTEM_ALERT: {
    titleEn: 'System Notification',
    titleAr: 'إشعار النظام',
    messageEn: '{message}',
    messageAr: '{message}',
  },
};

/**
 * Get localized notification content
 */
export function getNotificationContent(
  type: NotificationType,
  locale: 'en' | 'ar',
  variables?: Record<string, string | number>
): { title: string; message: string } {
  const template = NOTIFICATION_TEMPLATES[type];

  let title = locale === 'ar' ? template.titleAr : template.titleEn;
  let message = locale === 'ar' ? template.messageAr : template.messageEn;

  // Replace variables
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      title = title.replace(regex, String(value));
      message = message.replace(regex, String(value));
    });
  }

  return { title, message };
}

/**
 * WhatsApp template names mapping
 * These must match templates approved in Meta Business Manager
 */
export const WHATSAPP_TEMPLATES: Partial<Record<NotificationType, string>> = {
  TASK_ASSIGNED: 'task_assigned_ar',
  TASK_DUE_SOON: 'task_reminder_ar',
  PAYMENT_REQUEST: 'payment_request_ar',
  SHIPMENT_ARRIVAL: 'shipment_arrival_ar',
  SHIPMENT_RELEASED: 'shipment_released_ar',
  SHIPMENT_DELIVERED: 'shipment_delivered_ar',
};

/**
 * Get WhatsApp template name for notification type
 */
export function getWhatsAppTemplate(type: NotificationType): string | null {
  return WHATSAPP_TEMPLATES[type] || null;
}
