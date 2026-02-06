/**
 * Task Assignment Service
 * Automatically assigns tasks to users based on task category and assignment rules.
 *
 * Assignment Logic:
 * 1. Check if there's a specific assignment rule for the task category
 * 2. If rule specifies a userId, assign directly to that user
 * 3. If rule specifies a roleTarget, find users with that role
 * 4. Select the least-loaded user with that role
 * 5. Fallback to team members if no rules match
 */

import { Prisma, TaskCategory, UserRole } from '@prisma/client';

// Default category to role mapping (used when no custom rules exist)
export const DEFAULT_CATEGORY_ROLES: Record<TaskCategory, UserRole[]> = {
  DOCUMENTATION: ['CLERK', 'MANAGER'],
  CUSTOMS_DECLARATION: ['MANAGER', 'ADMIN'],
  PAYMENT: ['MANAGER', 'ADMIN'],
  INSPECTION: ['CLERK', 'MANAGER'],
  RELEASE: ['CLERK', 'MANAGER'],
  DELIVERY: ['CLERK', 'MANAGER'],
  GENERAL: ['CLERK', 'MANAGER', 'ADMIN'],
};

interface TaskForAssignment {
  id: string;
  category: TaskCategory;
  projectId: string | null;
  assignedTo: string[];
}

interface AssignmentResult {
  taskId: string;
  assignedUserId: string | null;
  assignedUserName: string | null;
  reason: string;
}

/**
 * Get assignment rules from database, ordered by priority
 */
async function getAssignmentRules(
  tx: Prisma.TransactionClient,
  category: TaskCategory
) {
  return tx.taskAssignmentRule.findMany({
    where: {
      category,
      isActive: true,
    },
    orderBy: { priority: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Find users with a specific role, ordered by task load
 */
async function findUsersByRole(
  tx: Prisma.TransactionClient,
  role: UserRole
) {
  const users = await tx.user.findMany({
    where: { role },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: {
          tasks: {
            where: {
              status: {
                in: ['PENDING', 'IN_PROGRESS'],
              },
            },
          },
        },
      },
    },
  });

  // Sort by task count (least loaded first)
  return users.sort((a, b) => a._count.tasks - b._count.tasks);
}

/**
 * Find the best user to assign a task to based on category
 */
export async function findBestAssignee(
  tx: Prisma.TransactionClient,
  category: TaskCategory,
  projectTeam: string[] = []
): Promise<{ userId: string; userName: string | null; reason: string } | null> {
  // 1. Check for specific assignment rules
  const rules = await getAssignmentRules(tx, category);

  for (const rule of rules) {
    // If rule has a specific user, use that user
    if (rule.userId && rule.user) {
      return {
        userId: rule.user.id,
        userName: rule.user.name,
        reason: `Assigned by rule: ${rule.description || category}`,
      };
    }

    // If rule has a role target, find users with that role
    if (rule.roleTarget) {
      const users = await findUsersByRole(tx, rule.roleTarget);
      const leastLoaded = users[0];
      if (leastLoaded) {
        return {
          userId: leastLoaded.id,
          userName: leastLoaded.name,
          reason: `Auto-assigned to ${rule.roleTarget} role (least loaded)`,
        };
      }
    }
  }

  // 2. Fallback to default role mapping
  const defaultRoles = DEFAULT_CATEGORY_ROLES[category];
  for (const role of defaultRoles) {
    const users = await findUsersByRole(tx, role);
    const leastLoaded = users[0];
    if (leastLoaded) {
      return {
        userId: leastLoaded.id,
        userName: leastLoaded.name,
        reason: `Auto-assigned to ${role} (default mapping)`,
      };
    }
  }

  // 3. Fallback to project team member if provided
  if (projectTeam.length > 0) {
    const teamMember = await tx.user.findFirst({
      where: {
        id: { in: projectTeam },
      },
      select: { id: true, name: true },
    });

    if (teamMember) {
      return {
        userId: teamMember.id,
        userName: teamMember.name,
        reason: 'Assigned to project team member',
      };
    }
  }

  return null;
}

/**
 * Auto-assign a single task
 */
export async function autoAssignTask(
  tx: Prisma.TransactionClient,
  task: TaskForAssignment,
  projectTeam: string[] = []
): Promise<AssignmentResult> {
  // Skip if already assigned
  if (task.assignedTo.length > 0) {
    return {
      taskId: task.id,
      assignedUserId: task.assignedTo[0] ?? null,
      assignedUserName: null,
      reason: 'Already assigned',
    };
  }

  const assignee = await findBestAssignee(tx, task.category, projectTeam);

  if (!assignee) {
    return {
      taskId: task.id,
      assignedUserId: null,
      assignedUserName: null,
      reason: 'No suitable assignee found',
    };
  }

  // Update task with assignment
  await tx.task.update({
    where: { id: task.id },
    data: {
      assignedTo: [assignee.userId],
    },
  });

  return {
    taskId: task.id,
    assignedUserId: assignee.userId,
    assignedUserName: assignee.userName,
    reason: assignee.reason,
  };
}

/**
 * Auto-assign multiple tasks (batch operation)
 */
export async function autoAssignTasks(
  tx: Prisma.TransactionClient,
  tasks: TaskForAssignment[],
  projectTeam: string[] = []
): Promise<AssignmentResult[]> {
  const results: AssignmentResult[] = [];

  for (const task of tasks) {
    const result = await autoAssignTask(tx, task, projectTeam);
    results.push(result);
  }

  return results;
}

/**
 * Get task assignment statistics
 */
export async function getAssignmentStats(
  tx: Prisma.TransactionClient
) {
  const userLoads = await tx.user.findMany({
    select: {
      id: true,
      name: true,
      role: true,
      _count: {
        select: {
          tasks: {
            where: {
              status: { in: ['PENDING', 'IN_PROGRESS'] },
            },
          },
        },
      },
    },
  });

  const categoryBreakdown = await tx.task.groupBy({
    by: ['category'],
    where: {
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
    _count: true,
  });

  return {
    userLoads: userLoads.map((u) => ({
      userId: u.id,
      userName: u.name,
      role: u.role,
      activeTasks: u._count.tasks,
    })),
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c.category,
      count: c._count,
    })),
  };
}

/**
 * Create or update an assignment rule
 */
export async function upsertAssignmentRule(
  tx: Prisma.TransactionClient,
  data: {
    category: TaskCategory;
    roleTarget?: UserRole;
    userId?: string;
    priority?: number;
    description?: string;
    isActive?: boolean;
  }
) {
  // Find existing rule for this category (without shipmentType)
  const existing = await tx.taskAssignmentRule.findFirst({
    where: {
      category: data.category,
      shipmentType: null,
    },
  });

  if (existing) {
    return tx.taskAssignmentRule.update({
      where: { id: existing.id },
      data: {
        roleTarget: data.roleTarget,
        userId: data.userId,
        priority: data.priority,
        description: data.description,
        isActive: data.isActive,
      },
    });
  }

  return tx.taskAssignmentRule.create({
    data: {
      category: data.category,
      roleTarget: data.roleTarget,
      userId: data.userId,
      priority: data.priority ?? 100,
      description: data.description,
      isActive: data.isActive ?? true,
    },
  });
}
