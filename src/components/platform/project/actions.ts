'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { ProjectFormValues } from './validation';
import { auth } from '@/auth';
import { ProjectStatus, ProjectPriority } from '@prisma/client';
import { executeProjectCascade } from '@/lib/services/project-cascade';

// Map string status to Prisma enum
function mapStatus(status: string | undefined): ProjectStatus {
  const statusMap: Record<string, ProjectStatus> = {
    pending: 'PENDING',
    in_progress: 'IN_PROGRESS',
    customs_hold: 'CUSTOMS_HOLD',
    released: 'RELEASED',
    delivered: 'DELIVERED',
  };
  return statusMap[status || 'pending'] || 'PENDING';
}

// Map string priority to Prisma enum
function mapPriority(priority: string | undefined): ProjectPriority {
  const priorityMap: Record<string, ProjectPriority> = {
    urgent: 'URGENT',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
  };
  return priorityMap[priority || 'medium'] || 'MEDIUM';
}

export async function createProject(data: ProjectFormValues | null) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    if (!data) {
      return { success: false, error: 'No data provided' };
    }

    const userId = session.user.id;

    // Use transaction for cascade creation
    const result = await db.$transaction(async (tx) => {
      // 1. Create the project
      const project = await tx.project.create({
        data: {
          customer: data.customer || '',
          blAwbNumber: data.blAwbNumber || null,
          description: data.description || '',
          status: mapStatus(data.status),
          priority: mapPriority(data.priority),
          systems: Array.isArray(data.systems) ? data.systems : [],
          activities: data.activities || undefined,
          customerId: data.customerId || null,
          portOfOrigin: data.portOfOrigin || null,
          portOfDestination: data.portOfDestination || null,
          teamLead: data.teamLead || null,
          team: Array.isArray(data.team) ? data.team : [],
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          userId,
        },
      });

      // 2. Execute cascade (shipment, stages, tasks) unless skipped
      let cascadeResult = null;
      if (!data.skipCascade) {
        cascadeResult = await executeProjectCascade(tx, {
          id: project.id,
          customer: project.customer,
          blAwbNumber: project.blAwbNumber,
          systems: project.systems,
          activities: project.activities,
          team: project.team,
          teamLead: project.teamLead,
          portOfOrigin: project.portOfOrigin,
          portOfDestination: project.portOfDestination,
          startDate: project.startDate,
          customerId: project.customerId,
        }, userId);
      }

      return { project, cascadeResult };
    });

    revalidatePath('/project');
    revalidatePath('/task');
    revalidatePath('/shipment');

    return {
      success: true,
      project: result.project,
      cascade: result.cascadeResult,
    };
  } catch (error) {
    console.error('Error creating project:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create project' };
  }
}

export async function getProjects() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const projects = await db.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!projects || projects.length === 0) {
      return { success: true, projects: [] };
    }

    return { success: true, projects };
  } catch (error) {
    console.error('Error in getProjects:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects',
    };
  }
}

export async function getProject(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    const project = await db.project.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { createdAt: 'asc' },
        },
        shipment: {
          include: {
            trackingStages: {
              orderBy: { stageType: 'asc' },
            },
            stageInvoices: {
              include: {
                invoice: true,
              },
            },
          },
        },
        client: true,
      },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    return { success: true, project };
  } catch (error) {
    console.error('Error fetching project:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch project' };
  }
}

export async function updateProject(id: string, data: Partial<ProjectFormValues> | null) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    if (!data) {
      return { success: false, error: 'No data provided' };
    }

    const projectData: Record<string, unknown> = {};

    if (data.customer !== undefined) projectData.customer = data.customer;
    if (data.blAwbNumber !== undefined) projectData.blAwbNumber = data.blAwbNumber;
    if (data.description !== undefined) projectData.description = data.description;
    if (data.status !== undefined) projectData.status = mapStatus(data.status);
    if (data.priority !== undefined) projectData.priority = mapPriority(data.priority);
    if (data.systems !== undefined) projectData.systems = data.systems;
    if (data.portOfOrigin !== undefined) projectData.portOfOrigin = data.portOfOrigin;
    if (data.portOfDestination !== undefined) projectData.portOfDestination = data.portOfDestination;
    if (data.teamLead !== undefined) projectData.teamLead = data.teamLead;
    if (data.team !== undefined) projectData.team = data.team;
    if (data.startDate !== undefined) projectData.startDate = data.startDate;
    if (data.endDate !== undefined) projectData.endDate = data.endDate;

    const project = await db.project.update({
      where: { id },
      data: projectData,
    });

    revalidatePath('/project');
    revalidatePath(`/project/${id}`);
    return { success: true, project };
  } catch (error) {
    console.error('Error updating project:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update project' };
  }
}

export async function deleteProject(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    await db.project.delete({
      where: { id },
    });

    revalidatePath('/project');
    return { success: true };
  } catch (error) {
    console.error('Error deleting project:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete project' };
  }
}
