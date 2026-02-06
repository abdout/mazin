/**
 * Task Reminder Jobs
 * Background jobs for sending task reminders and alerts
 */

import { db } from '@/lib/db';
import { notifyTaskAssigned, createNotification } from '@/lib/services/notification';

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
      console.error('Failed to send stage attention alert');
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
      console.error('Failed to send payment overdue reminder');
    }
  }

  return remindersSent;
}

/**
 * Run all scheduled reminder jobs
 */
export async function runAllReminderJobs() {
  const results = {
    dueSoonReminders: await sendTaskDueSoonReminders(),
    overdueAlerts: await sendTaskOverdueAlerts(),
    stageAlerts: await sendStageAttentionAlerts(),
    paymentReminders: await sendPaymentOverdueReminders(),
    timestamp: new Date().toISOString(),
  };

  return results;
}
