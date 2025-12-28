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
import { runAllReminderJobs } from '@/lib/jobs/task-reminders';

// Verify cron secret to prevent unauthorized access
function verifySecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // If no secret is configured, allow in development only
    return process.env.NODE_ENV === 'development';
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

  try {
    const results = await runAllReminderJobs();

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Cron job failed:', error);
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
