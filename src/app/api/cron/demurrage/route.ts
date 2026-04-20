import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createNotification } from '@/lib/services/notification';
import { logger } from '@/lib/logger';

const log = logger.forModule('api.cron-demurrage');

function verifySecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.replace('Bearer ', '');
  return bearerToken === cronSecret;
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return parseFloat(String(value));
}

export async function GET(request: NextRequest) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const shipments = await db.shipment.findMany({
      where: {
        demurrageStartDate: { not: null },
        status: { not: 'DELIVERED' },
      },
      select: {
        id: true,
        shipmentNumber: true,
        trackingNumber: true,
        freeDays: true,
        demurrageDailyRate: true,
        demurrageStartDate: true,
        userId: true,
        clientId: true,
        client: {
          select: {
            companyName: true,
            contactName: true,
          },
        },
      },
    });

    const now = new Date();
    let alertsSent = 0;

    for (const shipment of shipments) {
      if (!shipment.demurrageStartDate) continue;

      const freeDays = shipment.freeDays ?? 14;
      const startDate = new Date(shipment.demurrageStartDate);
      const daysElapsed = Math.max(
        0,
        Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      const freeDaysRemaining = freeDays - daysElapsed;
      const dailyRate = toNumber(shipment.demurrageDailyRate);
      const clientName =
        shipment.client?.companyName || shipment.client?.contactName || 'Unknown';

      // Alert thresholds: 7 days, 3 days, 1 day, overdue
      const thresholds = [
        { days: 7, type: 'approaching' as const },
        { days: 3, type: 'warning' as const },
        { days: 1, type: 'critical' as const },
        { days: 0, type: 'overdue' as const },
      ];

      for (const threshold of thresholds) {
        if (freeDaysRemaining !== threshold.days) continue;

        const isOverdue = threshold.type === 'overdue';
        const daysOverdue = Math.max(0, daysElapsed - freeDays);
        const accruedAmount = isOverdue ? daysOverdue * dailyRate : 0;

        const title = isOverdue
          ? `تنبيه: رسوم أرضيات على الشحنة ${shipment.shipmentNumber}`
          : `تنبيه: ${freeDaysRemaining} يوم متبقي - ${shipment.shipmentNumber}`;

        const message = isOverdue
          ? `الشحنة ${shipment.shipmentNumber} (${clientName}) تجاوزت المهلة المجانية بـ ${daysOverdue} يوم. المبلغ المتراكم: ${accruedAmount.toLocaleString()} SDG`
          : `الشحنة ${shipment.shipmentNumber} (${clientName}) متبقي ${freeDaysRemaining} يوم من المهلة المجانية. معدل الأرضيات: ${dailyRate.toLocaleString()} SDG/يوم`;

        const channels: ('IN_APP' | 'WHATSAPP')[] =
          freeDaysRemaining <= 1 ? ['IN_APP', 'WHATSAPP'] : ['IN_APP'];

        await createNotification({
          type: 'SYSTEM_ALERT',
          title,
          message,
          channels,
          userId: shipment.userId,
          clientId: shipment.clientId ?? undefined,
          shipmentId: shipment.id,
          metadata: {
            alertType: 'demurrage',
            urgency: threshold.type,
            freeDaysRemaining,
            dailyRate,
            daysOverdue: isOverdue ? daysOverdue : 0,
            accruedAmount: isOverdue ? accruedAmount : 0,
          },
        });

        alertsSent++;
        break; // Only send one alert per shipment per run
      }
    }

    log.info('Demurrage cron completed', {
      shipmentsChecked: shipments.length,
      alertsSent,
    });

    return NextResponse.json({
      success: true,
      shipmentsChecked: shipments.length,
      alertsSent,
    });
  } catch (error) {
    log.error('Demurrage cron failed', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
