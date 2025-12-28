/**
 * WhatsApp Business API Integration
 * Sends messages via Meta WhatsApp Cloud API
 */

import { db } from '@/lib/db';

export type WhatsAppTemplate =
  | 'task_assigned'
  | 'task_reminder'
  | 'payment_request'
  | 'shipment_update'
  | 'shipment_released'
  | 'shipment_delivered';

interface SendMessageParams {
  to: string;
  message?: string;
  template?: WhatsAppTemplate;
  parameters?: Record<string, string>;
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Format phone number for WhatsApp API
 * Expects: +249123456789 or 249123456789
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If starts with 0, assume Sudan and add country code
  if (cleaned.startsWith('0')) {
    cleaned = '249' + cleaned.substring(1);
  }

  // Remove + if present (API expects without +)
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Send WhatsApp message using Meta Cloud API
 */
export async function sendWhatsAppMessage(
  params: SendMessageParams
): Promise<WhatsAppResponse> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn('WhatsApp credentials not configured');
    return {
      success: false,
      error: 'WhatsApp not configured',
    };
  }

  const formattedPhone = formatPhoneNumber(params.to);

  try {
    let body: Record<string, unknown>;

    if (params.template) {
      // Send template message
      body = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: params.template,
          language: { code: 'ar' }, // Arabic by default
          components: params.parameters
            ? [
                {
                  type: 'body',
                  parameters: Object.entries(params.parameters).map(
                    ([, value]) => ({
                      type: 'text',
                      text: value,
                    })
                  ),
                },
              ]
            : undefined,
        },
      };
    } else if (params.message) {
      // Send text message
      body = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: params.message,
        },
      };
    } else {
      return {
        success: false,
        error: 'No message or template provided',
      };
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', data);

      // Log failed message
      await logWhatsAppMessage({
        phoneNumber: formattedPhone,
        templateName: params.template || 'text',
        status: 'FAILED',
        errorMessage: data.error?.message || 'Unknown error',
      });

      return {
        success: false,
        error: data.error?.message || 'Failed to send message',
      };
    }

    const messageId = data.messages?.[0]?.id;

    // Log successful message
    await logWhatsAppMessage({
      phoneNumber: formattedPhone,
      templateName: params.template || 'text',
      status: 'SENT',
      whatsappMessageId: messageId,
    });

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error('WhatsApp send error:', error);

    await logWhatsAppMessage({
      phoneNumber: formattedPhone,
      templateName: params.template || 'text',
      status: 'FAILED',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log WhatsApp message to database
 */
async function logWhatsAppMessage(data: {
  phoneNumber: string;
  templateName: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  whatsappMessageId?: string;
  errorMessage?: string;
}) {
  try {
    await db.whatsAppMessage.create({
      data: {
        phoneNumber: data.phoneNumber,
        templateName: data.templateName,
        status: data.status,
        whatsappMessageId: data.whatsappMessageId,
        ...(data.status === 'SENT' && { sentAt: new Date() }),
        ...(data.status === 'FAILED' && {
          metadata: { error: data.errorMessage },
        }),
      },
    });
  } catch (error) {
    console.error('Failed to log WhatsApp message:', error);
  }
}

/**
 * Update message status from webhook
 */
export async function updateWhatsAppMessageStatus(
  whatsappMessageId: string,
  status: 'DELIVERED' | 'READ' | 'FAILED',
  timestamp?: Date
) {
  try {
    await db.whatsAppMessage.updateMany({
      where: { whatsappMessageId },
      data: {
        status,
        ...(status === 'DELIVERED' && { deliveredAt: timestamp || new Date() }),
        ...(status === 'READ' && { readAt: timestamp || new Date() }),
      },
    });
  } catch (error) {
    console.error('Failed to update WhatsApp message status:', error);
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  signature: string,
  payload: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === `sha256=${expectedSignature}`;
}
