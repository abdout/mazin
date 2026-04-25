'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { TaskFormValues, taskFormSchema } from './validation';
import { auth } from '@/auth';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.forModule('task');

// Map string status to Prisma enum
function mapStatus(status: string | undefined): TaskStatus {
  const statusMap: Record<string, TaskStatus> = {
    pending: 'PENDING',
    stuck: 'STUCK',
    in_progress: 'IN_PROGRESS',
    done: 'DONE',
  };
  return statusMap[status || 'pending'] || 'PENDING';
}

// Map string priority to Prisma enum
function mapPriority(priority: string | undefined): TaskPriority {
  const priorityMap: Record<string, TaskPriority> = {
    urgent: 'URGENT',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
  };
  return priorityMap[priority || 'medium'] || 'MEDIUM';
}

export async function createTask(data: TaskFormValues) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    const taskData = {
      task: data.task || '',
      project: data.project || '',
      status: mapStatus(data.status),
      priority: mapPriority(data.priority),
      desc: data.desc || null,
      label: data.label || null,
      duration: data.duration || null,
      assignedTo: Array.isArray(data.assignedTo) ? data.assignedTo : [],
      date: data.date || null,
      hours: data.hours || null,
      projectId: data.projectId || null,
      userId: session.user.id,
    };

    const savedTask = await db.task.create({
      data: taskData,
    });

    revalidatePath('/task');
    return { success: true, taskId: savedTask.id };
  } catch (error) {
    log.error('Error creating task', error as Error);
    return { error: error instanceof Error ? error.message : 'Failed to create task' };
  }
}

export async function getTasks() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    const tasks = await db.task.findMany({
      where: { userId: session.user.id },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map to frontend format
    const simplifiedTasks = tasks.map((task) => ({
      _id: task.id,
      id: task.id,
      project: task.project || '',
      task: task.task || '',
      status: task.status.toLowerCase(),
      priority: task.priority.toLowerCase(),
      duration: task.duration || '',
      desc: task.desc || '',
      label: task.label || '',
      date: task.date,
      hours: task.hours || 0,
      assignedTo: task.assignedTo || [],
      projectId: task.projectId,
      linkedActivity: task.linkedActivity as {
        projectId: string;
        shipmentType: string;
        stage: string;
        substage: string;
        task?: string;
      } | null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return { success: true, tasks: simplifiedTasks };
  } catch (error) {
    log.error('Error fetching tasks', error as Error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch tasks' };
  }
}

export async function getTask(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    const task = await db.task.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!task) {
      return { error: 'Task not found' };
    }

    const simplifiedTask = {
      _id: task.id,
      id: task.id,
      project: task.project || '',
      task: task.task || '',
      status: task.status.toLowerCase(),
      priority: task.priority.toLowerCase(),
      duration: task.duration || '',
      desc: task.desc || '',
      label: task.label || '',
      date: task.date,
      hours: task.hours || 0,
      assignedTo: task.assignedTo || [],
      projectId: task.projectId,
      linkedActivity: task.linkedActivity as {
        projectId: string;
        shipmentType: string;
        stage: string;
        substage: string;
        task?: string;
      } | null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

    return { success: true, task: simplifiedTask };
  } catch (error) {
    log.error('Error fetching task', error as Error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch task' };
  }
}

export async function updateTask(id: string, data: Partial<TaskFormValues>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    const parsed = taskFormSchema.partial().safeParse(data);
    if (!parsed.success) {
      return { error: 'Invalid task data' };
    }
    const validated = parsed.data;

    const existingTask = await db.task.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!existingTask) {
      return { error: 'Task not found' };
    }

    const updateData: Record<string, unknown> = {};

    if (validated.task !== undefined) updateData.task = validated.task;
    if (validated.project !== undefined) updateData.project = validated.project;
    if (validated.status !== undefined) updateData.status = mapStatus(validated.status);
    if (validated.priority !== undefined) updateData.priority = mapPriority(validated.priority);
    if (validated.desc !== undefined) updateData.desc = validated.desc;
    if (validated.label !== undefined) updateData.label = validated.label;
    if (validated.duration !== undefined) updateData.duration = validated.duration;
    if (validated.assignedTo !== undefined) updateData.assignedTo = validated.assignedTo;
    if (validated.date !== undefined) updateData.date = validated.date;
    if (validated.hours !== undefined) updateData.hours = validated.hours;

    const updatedTask = await db.task.update({
      where: { id },
      data: updateData,
    });

    const simplifiedTask = {
      _id: updatedTask.id,
      id: updatedTask.id,
      project: updatedTask.project || '',
      task: updatedTask.task || '',
      status: updatedTask.status.toLowerCase(),
      priority: updatedTask.priority.toLowerCase(),
      duration: updatedTask.duration || '',
      desc: updatedTask.desc || '',
      label: updatedTask.label || '',
      date: updatedTask.date,
      hours: updatedTask.hours || 0,
      assignedTo: updatedTask.assignedTo || [],
      projectId: updatedTask.projectId,
      createdAt: updatedTask.createdAt,
      updatedAt: updatedTask.updatedAt,
    };

    revalidatePath('/task');
    return { success: true, task: simplifiedTask };
  } catch (error) {
    log.error('Error updating task', error as Error);
    return { error: error instanceof Error ? error.message : 'Failed to update task' };
  }
}

export async function deleteTask(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    const taskToDelete = await db.task.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!taskToDelete) {
      return { error: 'Task not found' };
    }

    await db.task.delete({
      where: { id },
    });

    revalidatePath('/task');
    return { success: true };
  } catch (error) {
    log.error('Error deleting task', error as Error);
    return { error: error instanceof Error ? error.message : 'Failed to delete task' };
  }
}

// Activity/Stage interface for typed access
interface StageActivity {
  shipmentType?: string;
  stage?: string;
  substage?: string;
  task?: string;
  // Legacy fields for backward compatibility
  system?: string;
  category?: string;
  subcategory?: string;
  activity?: string;
}

// Generate tasks from a project's stages/activities
export async function generateTasksFromProject(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }
    const userId = session.user.id;

    // Tenant-scoped: only the project's owner can (re)generate its tasks.
    const project = await db.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return { error: 'Project not found' };
    }

    // Extract stages/activities from project (supports both new and legacy format)
    const activities = (project.activities as StageActivity[]) || [];

    if (activities.length === 0) {
      return { success: true, message: 'No activities to generate tasks from' };
    }

    // Group activities by shipmentType-stage-substage (or system-category-subcategory for legacy)
    const groupedActivities = new Map<string, {
      shipmentType: string;
      stage: string;
      substage: string;
      tasks: string[];
    }>();

    activities.forEach((activity) => {
      // Support both new (shipmentType/stage/substage) and legacy (system/category/subcategory) formats
      const shipmentType = activity.shipmentType || activity.system || '';
      const stage = activity.stage || activity.category || '';
      const substage = activity.substage || activity.subcategory || '';
      const task = activity.task || activity.activity || '';

      const key = `${shipmentType}-${stage}-${substage}`;

      if (!groupedActivities.has(key)) {
        groupedActivities.set(key, {
          shipmentType,
          stage,
          substage,
          tasks: [],
        });
      }

      if (task) {
        groupedActivities.get(key)!.tasks.push(task);
      }
    });

    // Create one task per substage
    const tasksToCreate = Array.from(groupedActivities.values()).map((group) => ({
      task: group.substage,
      project: project.customer,
      projectId: project.id,
      status: 'PENDING' as const,
      priority: 'MEDIUM' as const,
      desc: `${group.substage} - ${group.stage} for ${project.customer}`,
      label: group.stage,
      duration: '4h',
      assignedTo: project.team || [],
      linkedActivity: {
        projectId: projectId,
        shipmentType: group.shipmentType,
        stage: group.stage,
        substage: group.substage,
        task: group.tasks.join(', '),
      },
      userId,
    }));

    if (tasksToCreate.length === 0) {
      return { success: true, message: 'No tasks to create after grouping' };
    }

    // Atomic: if createMany throws, the old tasks are preserved.
    const result = await db.$transaction(async (tx) => {
      await tx.task.deleteMany({
        where: {
          userId,
          linkedActivity: {
            path: ['projectId'],
            equals: projectId,
          },
        },
      });
      return tx.task.createMany({ data: tasksToCreate });
    });

    revalidatePath('/task');
    revalidatePath(`/project/${projectId}`);

    return {
      success: true,
      message: `Created ${result.count} tasks from ${project.customer}`,
      count: result.count,
    };
  } catch (error) {
    log.error('Error generating tasks from project', error as Error);
    return { error: error instanceof Error ? error.message : 'Failed to generate tasks' };
  }
}

// Sync all projects with tasks - generates granular tasks from project stages
export async function syncProjectsWithTasks() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }
    const userId = session.user.id;

    const BATCH_SIZE = 10;
    const results: Array<{
      projectId: string;
      name: string;
      success: boolean;
      message: string;
      count?: number;
    }> = [];

    let cursor: string | undefined;
    let totalProjects = 0;

    while (true) {
      const projects = await db.project.findMany({
        where: { userId },
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
        select: { id: true, customer: true },
      });

      if (projects.length === 0) break;
      totalProjects += projects.length;

      const batchResults = await Promise.all(
        projects.map(async (project) => {
          try {
            const result = await generateTasksFromProject(project.id);
            return {
              projectId: project.id,
              name: project.customer,
              success: result.success || false,
              message: result.message || result.error || '',
              count: result.count,
            };
          } catch (err) {
            return {
              projectId: project.id,
              name: project.customer,
              success: false,
              message: err instanceof Error ? err.message : 'Unknown error',
            };
          }
        })
      );

      results.push(...batchResults);
      cursor = projects[projects.length - 1]?.id;

      if (projects.length < BATCH_SIZE) break;
    }

    if (totalProjects === 0) {
      return { success: true, message: 'No projects to sync', results: [] };
    }

    const totalTasks = results.reduce((sum, r) => sum + (r.count || 0), 0);
    const successCount = results.filter(r => r.success).length;

    revalidatePath('/task');

    return {
      success: true,
      message: `Synced ${successCount}/${totalProjects} projects, created ${totalTasks} tasks`,
      results,
      totalTasks,
    };
  } catch (error) {
    log.error('Error syncing projects with tasks', error as Error);
    return { error: error instanceof Error ? error.message : 'Failed to sync' };
  }
}

// Get team members — scoped to users that appear in the caller's project.team
// arrays, plus the caller themselves. Prevents enumerating every user in the DB.
export async function getTeamMembers() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }
    const userId = session.user.id;

    const projects = await db.project.findMany({
      where: { userId },
      select: { team: true, teamLead: true },
    });

    const memberIds = new Set<string>();
    memberIds.add(userId);
    for (const p of projects) {
      if (p.teamLead) memberIds.add(p.teamLead);
      for (const m of p.team ?? []) memberIds.add(m);
    }

    const users = await db.user.findMany({
      where: { id: { in: Array.from(memberIds) } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      members: users.map((u) => ({ id: u.id, name: u.name ?? "Unknown" })),
    };
  } catch (err) {
    log.error("Failed to fetch team members", err as Error);
    return { error: "Failed to fetch team members" };
  }
}

// Get tasks for a specific project
export async function getTasksByProject(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    const tasks = await db.task.findMany({
      where: { projectId, userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const simplifiedTasks = tasks.map((task) => ({
      _id: task.id,
      id: task.id,
      project: task.project || '',
      task: task.task || '',
      status: task.status.toLowerCase(),
      priority: task.priority.toLowerCase(),
      duration: task.duration || '',
      desc: task.desc || '',
      label: task.label || '',
      date: task.date,
      hours: task.hours || 0,
      assignedTo: task.assignedTo || [],
      projectId: task.projectId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return { success: true, tasks: simplifiedTasks };
  } catch (error) {
    log.error("Failed to fetch project tasks", error as Error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch tasks' };
  }
}
