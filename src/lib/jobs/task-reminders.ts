/**
 * Task Reminder Jobs
 * Background jobs for sending task reminders and alerts
 */

import { db } from '@/lib/db';
import { notifyTaskAssigned, createNotification } from '@/lib/services/notification';
import { logger } from '@/lib/logger';

const log = logger.forModule('jobs.task-reminders');

interface ReminderResult {
  taskId: string;
  taskTitle: string;
  userId: string;
  type: 'due_soon' | 'overdue';
  notificationSent: boolean;
  error?: string;
}

/**
 * Send reminders for tasks due within the next 24 hours
 */
export async function sendTaskDueSoonReminders(hoursAhead: number = 24): Promise<ReminderResult[]> {
  const results: ReminderResult[] = [];

  const now = new Date();
  const cutoffTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  // Find tasks that are due soon and not completed
  const tasksDueSoon = await db.task.findMany({
    where: {
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      date: {
        gte: now,
        lte: cutoffTime,
      },
      // Only tasks with assigned users
      assignedTo: { isEmpty: false },
    },
    include: {
      projectRef: true,
    },
  });

  for (const task of tasksDueSoon) {
    for (const userId of task.assignedTo) {
      try {
        // Check if we've already sent a reminder for this task today
        const existingReminder = await db.notification.findFirst({
          where: {
            userId,
            taskId: task.id,
            type: 'TASK_DUE_SOON',
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        });

        if (existingReminder) {
          continue; // Skip if already reminded
        }

        // Calculate hours until due
        const hoursUntilDue = task.date
          ? Math.round((task.date.getTime() - now.getTime()) / (60 * 60 * 1000))
          : 0;

        await createNotification({
          type: 'TASK_DUE_SOON',
          title: 'Task Due Soon',
          message: `Task "${task.task}" is due in ${hoursUntilDue} hours`,
          channels: ['IN_APP', 'WHATSAPP'],
          userId,
          taskId: task.id,
          projectId: task.projectId || undefined,
          metadata: { hoursUntilDue, taskTitle: task.task },
        });

        results.push({
          taskId: task.id,
          taskTitle: task.task,
          userId,
          type: 'due_soon',
          notificationSent: true,
        });
      } catch (error) {
        results.push({
          taskId: task.id,
          taskTitle: task.task,
          userId,
          type: 'due_soon',
          notificationSent: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  return results;
}

/**
 * Send alerts for overdue tasks
 */
export async function sendTaskOverdueAlerts(): Promise<ReminderResult[]> {
  const results: ReminderResult[] = [];
  const now = new Date();

  // Find overdue tasks
  const overdueTasks = await db.task.findMany({
    where: {
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      date: { lt: now },
      assignedTo: { isEmpty: false },
    },
    include: {
      projectRef: true,
    },
  });

  for (const task of overdueTasks) {
    for (const userId of task.assignedTo) {
      try {
        // Check if we've already sent an overdue alert for this task today
        const existingAlert = await db.notification.findFirst({
          where: {
            userId,
            taskId: task.id,
            type: 'TASK_OVERDUE',
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            },
          },
        });

        if (existingAlert) {
          continue;
        }

        await createNotification({
          type: 'TASK_OVERDUE',
          title: 'Task Overdue',
          message: `Task "${task.task}" is overdue!`,
          channels: ['IN_APP', 'WHATSAPP'],
          userId,
          taskId: task.id,
          projectId: task.projectId || undefined,
          metadata: { taskTitle: task.task },
        });

        results.push({
          taskId: task.id,
          taskTitle: task.task,
          userId,
          type: 'overdue',
          notificationSent: true,
        });
      } catch (error) {
        results.push({
          taskId: task.id,
          taskTitle: task.task,
          userId,
          type: 'overdue',
          notificationSent: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  return results;
}

/**
 * Send alerts for stages that need attention (in progress for too long)
 */
export async function sendStageAttentionAlerts(hoursThreshold: number = 48): Promise<number> {
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - hoursThreshold * 60 * 60 * 1000);
  let alertsSent = 0;

  // Find stages that have been in progress for too long
  const stagesNeedingAttention = await db.trackingStage.findMany({
    where: {
      status: 'IN_PROGRESS',
      startedAt: { lt: cutoffTime },
    },
    include: {
      shipment: {
        include: {
          project: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  for (const stage of stagesNeedingAttention) {
    if (!stage.shipment?.project?.user) continue;

    const userId = stage.shipment.project.userId;

    // Check if we've already sent an alert for this stage today
    const existingAlert = await db.notification.findFirst({
      where: {
        userId,
        shipmentId: stage.shipmentId,
        type: 'STAGE_ATTENTION_NEEDED',
        createdAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
        metadata: {
          path: ['stageType'],
          equals: stage.stageType,
        },
      },
    });

    if (existingAlert) continue;

    try {
      await createNotification({
        type: 'STAGE_ATTENTION_NEEDED',
        title: 'Stage Attention Needed',
        message: `Stage "${stage.stageType.replace(/_/g, ' ')}" has been in progress for over ${hoursThreshold} hours`,
        channels: ['IN_APP'],
        userId,
        shipmentId: stage.shipmentId,
        projectId: stage.shipment.project.id,
        metadata: { stageType: stage.stageType },
      });
      alertsSent++;
    } catch (error) {
      log.error('Failed to send stage attention alert', error as Error);
    }
  }

  return alertsSent;
}

/**
 * Send payment overdue reminders
 */
export async function sendPaymentOverdueReminders(): Promise<number> {
  const now = new Date();
  let remindersSent = 0;

  // Find overdue unpaid invoices
  const overdueInvoices = await db.invoice.findMany({
    where: {
      status: { in: ['DRAFT', 'SENT'] },
      dueDate: { lt: now },
    },
    include: {
      client: true,
      shipment: true,
    },
  });

  for (const invoice of overdueInvoices) {
    if (!invoice.clientId) continue;

    // Check if we've already sent a reminder today
    const existingReminder = await db.notification.findFirst({
      where: {
        clientId: invoice.clientId,
        invoiceId: invoice.id,
        type: 'PAYMENT_OVERDUE',
        createdAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingReminder) continue;

    try {
      await createNotification({
        type: 'PAYMENT_OVERDUE',
        title: 'Payment Overdue',
        message: `Invoice ${invoice.invoiceNumber} is overdue. Amount: ${Number(invoice.total).toLocaleString()} ${invoice.currency}`,
        channels: ['IN_APP', 'WHATSAPP'],
        clientId: invoice.clientId,
        invoiceId: invoice.id,
        shipmentId: invoice.shipmentId || undefined,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          amount: Number(invoice.total),
          currency: invoice.currency,
        },
      });
      remindersSent++;
    } catch (error) {
      log.error('Failed to send payment overdue reminder', error as Error);
    }
  }

  return remindersSent;
}

/**
 * IM Form expiry alerts.
 *
 * Sudanese banks issue IM forms with an explicit expiry date. Missing expiry
 * means the import allocation is lost and the importer has to re-apply. Cron
 * pings at T-10d, T-5d, T-3d, T-1d, day-of, and overdue. Auto-flips status
 * `ACTIVE → EXPIRED` once the expiry date passes.
 */
export async function sendIMFormExpiryAlerts(): Promise<number> {
  const now = new Date()
  let alertsSent = 0

  // Pull every active IM form. Cheap query — typically a few rows per operator.
  const imForms = await db.iMForm.findMany({
    where: { status: { in: ["ACTIVE", "VALUE_MISMATCH"] } },
    include: {
      shipment: {
        select: { id: true, shipmentNumber: true, userId: true, clientId: true },
      },
    },
  })

  // Auto-expire crossed-deadline rows (single update before alerting on warning
  // buckets so we don't double-fire EXPIRED twice).
  const expiredIds = imForms
    .filter((im) => im.expiryDate && im.expiryDate < now)
    .map((im) => im.id)
  if (expiredIds.length) {
    await db.iMForm.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: "EXPIRED" },
    })
  }

  for (const im of imForms) {
    if (!im.expiryDate) continue
    const daysUntilExpiry = Math.ceil(
      (im.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Buckets — one alert per bucket, dedupKey hashed by date so re-runs collide.
    const bucket =
      daysUntilExpiry < 0
        ? "overdue"
        : daysUntilExpiry === 0
          ? "today"
          : daysUntilExpiry === 1
            ? "1d"
            : daysUntilExpiry === 3
              ? "3d"
              : daysUntilExpiry === 5
                ? "5d"
                : daysUntilExpiry === 10
                  ? "10d"
                  : null
    if (!bucket) continue

    const todayKey = now.toISOString().slice(0, 10)
    const dedupKey = `im-expiry:${im.id}:${bucket}:${todayKey}`

    const title =
      bucket === "overdue"
        ? `IM Form expired: ${im.imNumber}`
        : `IM Form expiring in ${daysUntilExpiry} day(s): ${im.imNumber}`
    const message =
      bucket === "overdue"
        ? `IM Form ${im.imNumber} (${im.bankName}) has expired. The bank-allocation is no longer valid.`
        : `IM Form ${im.imNumber} (${im.bankName}) expires on ${im.expiryDate.toDateString()}.`

    try {
      await createNotification({
        type: "SYSTEM_ALERT",
        title,
        message,
        channels: bucket === "overdue" || bucket === "1d" ? ["IN_APP", "WHATSAPP"] : ["IN_APP"],
        userId: im.shipment.userId,
        clientId: im.shipment.clientId ?? undefined,
        shipmentId: im.shipment.id,
        dedupKey,
        metadata: {
          alertType: "im-expiry",
          bucket,
          daysUntilExpiry,
          imNumber: im.imNumber,
          bankName: im.bankName,
        },
      })
      alertsSent++
    } catch (err) {
      log.error("Failed to send IM expiry alert", err as Error, { imId: im.id })
    }
  }

  return alertsSent
}

/**
 * Stage SLA breach detection.
 *
 * Each `TrackingStageType` carries an `estimatedHours` (`src/lib/tracking/constants.ts`).
 * Once a stage has been `IN_PROGRESS` for longer than that estimate, we surface a warn
 * notification; at 2x estimate, we escalate to "breached." Records the breach on the
 * stage row so the cockpit can list "stuck shipments" without recomputing.
 */
export async function sendStageSlaBreachAlerts(): Promise<number> {
  const now = new Date()
  let alertsSent = 0

  // Lazy-import the constants table so the cron module stays light.
  const { STAGE_CONFIG } = await import("@/lib/tracking/constants")

  const inProgress = await db.trackingStage.findMany({
    where: { status: "IN_PROGRESS" },
    include: {
      shipment: {
        select: { id: true, shipmentNumber: true, userId: true, clientId: true },
      },
    },
  })

  for (const stage of inProgress) {
    if (!stage.startedAt) continue
    const config = STAGE_CONFIG[stage.stageType]
    if (!config?.estimatedHours || config.estimatedHours <= 0) continue

    const elapsedHours = (now.getTime() - stage.startedAt.getTime()) / (1000 * 60 * 60)
    const warnAt = config.estimatedHours
    const breachAt = config.estimatedHours * 2

    if (elapsedHours < warnAt) continue

    const severity = elapsedHours >= breachAt ? "breach" : "warn"
    const todayKey = now.toISOString().slice(0, 10)
    const dedupKey = `stage-sla:${stage.shipmentId}:${stage.stageType}:${severity}:${todayKey}`

    try {
      await createNotification({
        type: "STAGE_ATTENTION_NEEDED",
        title:
          severity === "breach"
            ? `Stage SLA breached: ${stage.stageType}`
            : `Stage running long: ${stage.stageType}`,
        message: `Shipment ${stage.shipment.shipmentNumber} has been at ${stage.stageType} for ${elapsedHours.toFixed(0)}h (estimate ${warnAt}h)`,
        channels: severity === "breach" ? ["IN_APP", "WHATSAPP"] : ["IN_APP"],
        userId: stage.shipment.userId,
        shipmentId: stage.shipmentId,
        dedupKey,
        metadata: {
          alertType: "stage-sla",
          severity,
          stageType: stage.stageType,
          elapsedHours,
          estimatedHours: warnAt,
        },
      })
      alertsSent++
    } catch (err) {
      log.error("Failed to send stage SLA alert", err as Error, {
        shipmentId: stage.shipmentId,
      })
    }
  }

  return alertsSent
}

/**
 * Multi-bucket invoice reminder schedule (lifted from hogwarts `fee-overdue`):
 *   T-7d, T-1d, due-day, +3d, +7d, +14d, +30d. Each bucket fires at most once
 *   per day per invoice via `Notification.dedupKey`.
 *
 * Side-effect: invoices crossing their `dueDate` are flipped to `OVERDUE`. The
 * existing `sendPaymentOverdueReminders` only sent notifications without
 * updating status — that gap is now closed.
 */
export async function sendInvoiceReminderSchedule(): Promise<number> {
  const now = new Date()
  let sent = 0

  // Closed-form pre-due window: anything due in next 8 days, plus everything
  // already past due. Excludes paid/cancelled.
  const lookAheadEnd = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000)
  const invoices = await db.invoice.findMany({
    where: {
      status: { in: ["DRAFT", "SENT", "OVERDUE"] },
      dueDate: { lte: lookAheadEnd },
    },
    select: {
      id: true,
      invoiceNumber: true,
      total: true,
      currency: true,
      dueDate: true,
      status: true,
      clientId: true,
      shipmentId: true,
      userId: true,
    },
  })

  // Auto-flip newly-overdue invoices.
  const newlyOverdue = invoices
    .filter((inv) => inv.status !== "OVERDUE" && inv.dueDate && inv.dueDate < now)
    .map((inv) => inv.id)
  if (newlyOverdue.length) {
    await db.invoice.updateMany({
      where: { id: { in: newlyOverdue } },
      data: { status: "OVERDUE" },
    })
  }

  for (const inv of invoices) {
    if (!inv.clientId || !inv.dueDate) continue
    const daysFromDue = Math.ceil(
      (now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    let bucket: string | null = null
    if (daysFromDue === -7) bucket = "T-7d"
    else if (daysFromDue === -1) bucket = "T-1d"
    else if (daysFromDue === 0) bucket = "due"
    else if (daysFromDue === 3) bucket = "+3d"
    else if (daysFromDue === 7) bucket = "+7d"
    else if (daysFromDue === 14) bucket = "+14d"
    else if (daysFromDue === 30) bucket = "+30d"
    if (!bucket) continue

    const todayKey = now.toISOString().slice(0, 10)
    const dedupKey = `invoice-reminder:${inv.id}:${bucket}:${todayKey}`
    const isOverdueBucket = daysFromDue > 0
    const channels: ("IN_APP" | "WHATSAPP" | "EMAIL")[] = isOverdueBucket
      ? ["IN_APP", "WHATSAPP", "EMAIL"]
      : ["IN_APP", "WHATSAPP"]

    try {
      await createNotification({
        type: isOverdueBucket ? "PAYMENT_OVERDUE" : "PAYMENT_REQUEST",
        title: isOverdueBucket
          ? `Payment overdue: ${inv.invoiceNumber}`
          : `Payment due ${daysFromDue === 0 ? "today" : `in ${-daysFromDue} day(s)`}: ${inv.invoiceNumber}`,
        message: `Invoice ${inv.invoiceNumber}: ${Number(inv.total).toLocaleString()} ${inv.currency}`,
        channels,
        clientId: inv.clientId,
        invoiceId: inv.id,
        shipmentId: inv.shipmentId || undefined,
        userId: inv.userId,
        dedupKey,
        metadata: {
          alertType: "invoice-reminder",
          bucket,
          daysFromDue,
          invoiceNumber: inv.invoiceNumber,
          amount: Number(inv.total),
          currency: inv.currency,
        },
      })
      sent++
    } catch (err) {
      log.error("Failed to send invoice reminder", err as Error, { invoiceId: inv.id })
    }
  }

  return sent
}

/**
 * Run all scheduled reminder jobs
 */
/**
 * Purge `JobRun` rows older than the retention window. Folded into the daily reminders
 * cron because Vercel Hobby caps daily crons — keeps us under the limit instead of
 * taking another slot for a tiny housekeeping query.
 */
export async function purgeStaleJobRuns(retentionDays = 90): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
  const { count } = await db.jobRun.deleteMany({
    where: { startedAt: { lt: cutoff } },
  })
  return count
}

export async function runAllReminderJobs() {
  log.info("Starting reminder jobs")

  const dueSoonReminders = await sendTaskDueSoonReminders()
  log.info(`Due soon: ${dueSoonReminders.length} reminders sent`)

  const overdueAlerts = await sendTaskOverdueAlerts()
  log.info(`Overdue: ${overdueAlerts.length} alerts sent`)

  const stageAlerts = await sendStageAttentionAlerts()
  log.info(`Stage attention: ${stageAlerts} alerts sent`)

  const stageSlaAlerts = await sendStageSlaBreachAlerts()
  log.info(`Stage SLA: ${stageSlaAlerts} alerts sent`)

  const paymentReminders = await sendPaymentOverdueReminders()
  log.info(`Payment overdue: ${paymentReminders} reminders sent`)

  const invoiceReminders = await sendInvoiceReminderSchedule()
  log.info(`Invoice schedule: ${invoiceReminders} reminders sent`)

  const imExpiryAlerts = await sendIMFormExpiryAlerts()
  log.info(`IM expiry: ${imExpiryAlerts} alerts sent`)

  const purgedJobRuns = await purgeStaleJobRuns()
  log.info(`Purged ${purgedJobRuns} stale JobRun rows`)

  const results = {
    dueSoonReminders,
    overdueAlerts,
    stageAlerts,
    stageSlaAlerts,
    paymentReminders,
    invoiceReminders,
    imExpiryAlerts,
    purgedJobRuns,
    timestamp: new Date().toISOString(),
  }

  log.info("Reminder jobs completed", {
    dueSoon: dueSoonReminders.length,
    overdue: overdueAlerts.length,
    stageAlerts,
    stageSlaAlerts,
    paymentReminders,
    invoiceReminders,
    imExpiryAlerts,
    purgedJobRuns,
  })

  return results
}
