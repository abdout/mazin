'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { TaskFormValues } from './validation';
import { auth } from '@/auth';
import { TaskStatus, TaskPriority } from '@prisma/client';

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
    console.error('Error creating task:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create task' };
  }
}

export async function getTasks() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Not authenticated' };
    }

    const tasks = await db.task.findMany({
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
    console.error('Error fetching tasks:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch tasks' };
  }
}

export async function getTask(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Not authenticated' };
    }

    const task = await db.task.findUnique({
      where: { id },
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
    console.error('Error fetching task:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch task' };
  }
}

export async function updateTask(id: string, data: Partial<TaskFormValues>) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Not authenticated' };
    }

    const existingTask = await db.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return { error: 'Task not found' };
    }

    const updateData: Record<string, unknown> = {};

    if (data.task !== undefined) updateData.task = data.task;
    if (data.project !== undefined) updateData.project = data.project;
    if (data.status !== undefined) updateData.status = mapStatus(data.status);
    if (data.priority !== undefined) updateData.priority = mapPriority(data.priority);
    if (data.desc !== undefined) updateData.desc = data.desc;
    if (data.label !== undefined) updateData.label = data.label;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.hours !== undefined) updateData.hours = data.hours;

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
    console.error('Error updating task:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update task' };
  }
}

export async function deleteTask(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Not authenticated' };
    }

    const taskToDelete = await db.task.findUnique({
      where: { id },
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
    console.error('Error deleting task:', error);
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

    // Get project with activities
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return { error: 'Project not found' };
    }

    // Extract stages/activities from project (supports both new and legacy format)
    const activities = (project.activities as StageActivity[]) || [];

    if (activities.length === 0) {
      return { success: true, message: 'No activities to generate tasks from' };
    }

    // Delete existing auto-generated tasks for this project
    await db.task.deleteMany({
      where: {
        linkedActivity: {
          path: ['projectId'],
          equals: projectId,
        },
      },
    });

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
      userId: session.user.id!,
    }));

    if (tasksToCreate.length === 0) {
      return { success: true, message: 'No tasks to create after grouping' };
    }

    const result = await db.task.createMany({
      data: tasksToCreate,
    });

    revalidatePath('/task');
    revalidatePath(`/project/${projectId}`);

    return {
      success: true,
      message: `Created ${result.count} tasks from ${project.customer}`,
      count: result.count,
    };
  } catch (error) {
    console.error('Error generating tasks from project:', error);
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

    // Get all projects
    const projects = await db.project.findMany();

    if (projects.length === 0) {
      return { success: true, message: 'No projects to sync', results: [] };
    }

    // Process each project
    const results: Array<{
      projectId: string;
      name: string;
      success: boolean;
      message: string;
      count?: number;
    }> = [];

    for (const project of projects) {
      try {
        const result = await generateTasksFromProject(project.id);

        results.push({
          projectId: project.id,
          name: project.customer,
          success: result.success || false,
          message: result.message || result.error || '',
          count: result.count,
        });
      } catch (err) {
        results.push({
          projectId: project.id,
          name: project.customer,
          success: false,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const totalTasks = results.reduce((sum, r) => sum + (r.count || 0), 0);
    const successCount = results.filter(r => r.success).length;

    revalidatePath('/task');

    return {
      success: true,
      message: `Synced ${successCount}/${projects.length} projects, created ${totalTasks} tasks`,
      results,
      totalTasks,
    };
  } catch (error) {
    console.error('Error syncing projects with tasks:', error);
    return { error: error instanceof Error ? error.message : 'Failed to sync' };
  }
}

// Get tasks for a specific project
export async function getTasksByProject(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Not authenticated' };
    }

    const tasks = await db.task.findMany({
      where: { projectId },
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
    console.error('Error fetching project tasks:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch tasks' };
  }
}
