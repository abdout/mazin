/**
 * Project Cascade Service
 * Handles automatic creation of shipment, tracking stages, and tasks
 * when a new project is created.
 */

import { Prisma, ShipmentType, TrackingStageStatus, TaskCategory, TaskPriority, TaskStatus } from '@prisma/client';
import {
  generateTrackingNumber,
  generateTrackingSlug,
  generateShipmentNumber,
  calculateStageETAs,
  TRACKING_STAGES,
  STAGE_CONFIG,
} from '@/lib/utils/tracking';
import { CLEARANCE_STAGE_TASKS, mapStageToCategory } from './task-templates';
import { autoAssignTasks } from './task-assignment';

// Types for the cascade
interface AssignmentResult {
  taskId: string;
  assignedUserId: string | null;
  assignedUserName: string | null;
  reason: string;
}

interface CascadeResult {
  shipment: {
    id: string;
    trackingNumber: string;
    trackingSlug: string;
    shipmentNumber: string;
  };
  stagesCreated: number;
  tasksCreated: number;
  tasksAssigned: number;
  assignments: AssignmentResult[];
}

interface ProjectData {
  id: string;
  customer: string;
  blAwbNumber: string | null;
  systems: string[];
  activities: Prisma.JsonValue;
  team: string[];
  teamLead: string | null;
  portOfOrigin: string | null;
  portOfDestination: string | null;
  startDate: Date | null;
  customerId: string | null;
}

/**
 * Create shipment with tracking stages for a project
 */
export async function createShipmentWithStages(
  tx: Prisma.TransactionClient,
  project: ProjectData,
  userId: string
): Promise<CascadeResult['shipment'] & { stagesCreated: number }> {
  const trackingNumber = generateTrackingNumber();
  const trackingSlug = generateTrackingSlug();
  const shipmentNumber = generateShipmentNumber();

  // Determine shipment type from project systems
  const isExport = project.systems.some((s) => s.toLowerCase().includes('export'));
  const shipmentType: ShipmentType = isExport ? 'EXPORT' : 'IMPORT';

  // Calculate ETAs for each stage
  const stageETAs = calculateStageETAs(project.startDate);

  // Create shipment
  const shipment = await tx.shipment.create({
    data: {
      shipmentNumber,
      trackingNumber,
      trackingSlug,
      type: shipmentType,
      status: 'PENDING',
      description: `Clearance for ${project.customer}`,
      consignor: project.portOfOrigin || 'TBD',
      consignee: project.customer,
      vesselName: null,
      containerNumber: null,
      arrivalDate: project.startDate,
      publicTrackingEnabled: true,
      userId,
      projectId: project.id,
      clientId: project.customerId,
    },
  });

  // Create all 11 tracking stages
  const stageData = TRACKING_STAGES.map((stage, index) => ({
    shipmentId: shipment.id,
    stageType: stage,
    status: (index === 0 ? 'IN_PROGRESS' : 'PENDING') as TrackingStageStatus,
    estimatedAt: stageETAs[stage]?.start || null,
    startedAt: index === 0 ? new Date() : null,
    paymentRequested: false,
    paymentReceived: false,
  }));

  await tx.trackingStage.createMany({
    data: stageData,
  });

  return {
    id: shipment.id,
    trackingNumber,
    trackingSlug,
    shipmentNumber,
    stagesCreated: TRACKING_STAGES.length,
  };
}

/**
 * Generate tasks from project activities with proper categories
 */
export async function generateTasksWithCategories(
  tx: Prisma.TransactionClient,
  project: ProjectData,
  userId: string
): Promise<number> {
  // Get activities from project
  const activities = (project.activities as Array<{
    shipmentType?: string;
    stage?: string;
    substage?: string;
    task?: string;
    system?: string;
    category?: string;
    subcategory?: string;
    activity?: string;
  }>) || [];

  if (activities.length === 0) {
    // If no activities, create default tasks based on clearance stages
    return await createDefaultTasks(tx, project, userId);
  }

  // Group activities by shipmentType-stage-substage
  const groupedActivities = new Map<string, {
    shipmentType: string;
    stage: string;
    substage: string;
    tasks: string[];
  }>();

  activities.forEach((activity) => {
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

  // Create tasks from grouped activities
  const tasksToCreate = Array.from(groupedActivities.values()).map((group) => {
    const category = mapStageToCategory(group.stage);
    const trackingStageType = mapStageToTrackingStage(group.stage);

    return {
      task: group.substage || group.stage,
      project: project.customer,
      projectId: project.id,
      status: 'PENDING' as TaskStatus,
      priority: 'MEDIUM' as TaskPriority,
      category,
      trackingStageType,
      desc: `${group.substage || group.stage} - ${group.stage} for ${project.customer}`,
      label: group.stage,
      duration: '4h',
      assignedTo: project.team || [],
      linkedActivity: {
        projectId: project.id,
        shipmentType: group.shipmentType,
        stage: group.stage,
        substage: group.substage,
        task: group.tasks.join(', '),
      },
      userId,
    };
  });

  if (tasksToCreate.length === 0) {
    return 0;
  }

  const result = await tx.task.createMany({
    data: tasksToCreate,
  });

  return result.count;
}

/**
 * Create default tasks when no activities are provided
 */
async function createDefaultTasks(
  tx: Prisma.TransactionClient,
  project: ProjectData,
  userId: string
): Promise<number> {
  const defaultTasks = [
    { title: 'Collect Documents', category: 'DOCUMENTATION' as TaskCategory, stage: 'PRE_ARRIVAL_DOCS' },
    { title: 'Verify Commercial Invoice', category: 'DOCUMENTATION' as TaskCategory, stage: 'PRE_ARRIVAL_DOCS' },
    { title: 'Prepare Customs Declaration', category: 'CUSTOMS_DECLARATION' as TaskCategory, stage: 'CUSTOMS_DECLARATION' },
    { title: 'Submit Declaration', category: 'CUSTOMS_DECLARATION' as TaskCategory, stage: 'CUSTOMS_DECLARATION' },
    { title: 'Calculate Duties', category: 'PAYMENT' as TaskCategory, stage: 'CUSTOMS_PAYMENT' },
    { title: 'Collect Payment from Client', category: 'PAYMENT' as TaskCategory, stage: 'CUSTOMS_PAYMENT' },
    { title: 'Schedule Inspection', category: 'INSPECTION' as TaskCategory, stage: 'INSPECTION' },
    { title: 'Attend Inspection', category: 'INSPECTION' as TaskCategory, stage: 'INSPECTION' },
    { title: 'Pay Port Fees', category: 'RELEASE' as TaskCategory, stage: 'PORT_FEES' },
    { title: 'Obtain Release Order', category: 'RELEASE' as TaskCategory, stage: 'RELEASE' },
    { title: 'Arrange Transport', category: 'DELIVERY' as TaskCategory, stage: 'LOADING' },
    { title: 'Confirm Delivery', category: 'DELIVERY' as TaskCategory, stage: 'DELIVERED' },
  ];

  const tasksToCreate = defaultTasks.map((t, index) => ({
    task: t.title,
    project: project.customer,
    projectId: project.id,
    status: 'PENDING' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    category: t.category,
    trackingStageType: t.stage as any,
    desc: `${t.title} for ${project.customer}`,
    label: t.category,
    duration: '2h',
    assignedTo: project.team || [],
    date: project.startDate ? new Date(project.startDate.getTime() + index * 24 * 60 * 60 * 1000) : null,
    userId,
  }));

  const result = await tx.task.createMany({
    data: tasksToCreate,
  });

  return result.count;
}

/**
 * Map stage name to tracking stage type
 */
function mapStageToTrackingStage(stageName: string): any | null {
  const stageMap: Record<string, string> = {
    'pre-arrival': 'PRE_ARRIVAL_DOCS',
    'documentation': 'PRE_ARRIVAL_DOCS',
    'arrival': 'VESSEL_ARRIVAL',
    'vessel': 'VESSEL_ARRIVAL',
    'declaration': 'CUSTOMS_DECLARATION',
    'customs': 'CUSTOMS_DECLARATION',
    'payment': 'CUSTOMS_PAYMENT',
    'duty': 'CUSTOMS_PAYMENT',
    'inspection': 'INSPECTION',
    'port': 'PORT_FEES',
    'quality': 'QUALITY_STANDARDS',
    'release': 'RELEASE',
    'loading': 'LOADING',
    'transit': 'IN_TRANSIT',
    'transport': 'IN_TRANSIT',
    'delivery': 'DELIVERED',
    'delivered': 'DELIVERED',
  };

  const lowerStage = stageName.toLowerCase();
  for (const [key, value] of Object.entries(stageMap)) {
    if (lowerStage.includes(key)) {
      return value;
    }
  }
  return null;
}

/**
 * Full project cascade - creates shipment, stages, and tasks
 */
export async function executeProjectCascade(
  tx: Prisma.TransactionClient,
  project: ProjectData,
  userId: string
): Promise<CascadeResult> {
  // 1. Create shipment with tracking stages
  const shipmentResult = await createShipmentWithStages(tx, project, userId);

  // 2. Generate tasks from activities
  const tasksCreated = await generateTasksWithCategories(tx, project, userId);

  // 3. Auto-assign tasks based on category rules
  let tasksAssigned = 0;
  let assignments: AssignmentResult[] = [];

  if (tasksCreated > 0) {
    // Fetch the created tasks for assignment
    const createdTasks = await tx.task.findMany({
      where: { projectId: project.id },
      select: {
        id: true,
        category: true,
        projectId: true,
        assignedTo: true,
      },
    });

    // Auto-assign tasks
    assignments = await autoAssignTasks(
      tx,
      createdTasks.map((t) => ({
        id: t.id,
        category: t.category,
        projectId: t.projectId,
        assignedTo: t.assignedTo,
      })),
      project.team
    );

    tasksAssigned = assignments.filter((a) => a.assignedUserId !== null).length;
  }

  return {
    shipment: {
      id: shipmentResult.id,
      trackingNumber: shipmentResult.trackingNumber,
      trackingSlug: shipmentResult.trackingSlug,
      shipmentNumber: shipmentResult.shipmentNumber,
    },
    stagesCreated: shipmentResult.stagesCreated,
    tasksCreated,
    tasksAssigned,
    assignments,
  };
}
