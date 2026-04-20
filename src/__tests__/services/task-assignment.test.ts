import { describe, it, expect, vi, beforeEach } from "vitest"
import { db } from "@/lib/db"
import {
  DEFAULT_CATEGORY_ROLES,
  findBestAssignee,
  autoAssignTask,
  autoAssignTasks,
  getAssignmentStats,
  upsertAssignmentRule,
} from "@/lib/services/task-assignment"
import { makeUser } from "@/__tests__/helpers/factories"

const mockDb = db as any

beforeEach(() => {
  vi.clearAllMocks()
})

// =============================================================================
// DEFAULT_CATEGORY_ROLES
// =============================================================================

describe("DEFAULT_CATEGORY_ROLES", () => {
  it("maps all seven task categories", () => {
    const categories = [
      "DOCUMENTATION",
      "CUSTOMS_DECLARATION",
      "PAYMENT",
      "INSPECTION",
      "RELEASE",
      "DELIVERY",
      "GENERAL",
    ]
    for (const cat of categories) {
      expect(DEFAULT_CATEGORY_ROLES[cat as keyof typeof DEFAULT_CATEGORY_ROLES]).toBeDefined()
    }
  })

  it("DOCUMENTATION defaults to CLERK then MANAGER", () => {
    expect(DEFAULT_CATEGORY_ROLES.DOCUMENTATION).toEqual(["CLERK", "MANAGER"])
  })

  it("CUSTOMS_DECLARATION defaults to MANAGER then ADMIN", () => {
    expect(DEFAULT_CATEGORY_ROLES.CUSTOMS_DECLARATION).toEqual(["MANAGER", "ADMIN"])
  })

  it("GENERAL includes all three roles", () => {
    expect(DEFAULT_CATEGORY_ROLES.GENERAL).toEqual(["CLERK", "MANAGER", "ADMIN"])
  })
})

// =============================================================================
// findBestAssignee
// =============================================================================

describe("findBestAssignee", () => {
  it("assigns directly when rule specifies a userId", async () => {
    const user = makeUser({ id: "user-1", name: "Ali" })
    mockDb.taskAssignmentRule.findMany.mockResolvedValue([
      {
        id: "rule-1",
        category: "DOCUMENTATION",
        userId: user.id,
        roleTarget: null,
        priority: 1,
        description: "Docs go to Ali",
        isActive: true,
        user: { id: user.id, name: user.name, email: user.email },
      },
    ] as any)

    const result = await findBestAssignee(mockDb, "DOCUMENTATION")

    expect(result).not.toBeNull()
    expect(result!.userId).toBe("user-1")
    expect(result!.userName).toBe("Ali")
    expect(result!.reason).toContain("rule")
  })

  it("finds least-loaded user when rule specifies roleTarget", async () => {
    mockDb.taskAssignmentRule.findMany.mockResolvedValue([
      {
        id: "rule-2",
        category: "INSPECTION",
        userId: null,
        user: null,
        roleTarget: "CLERK",
        priority: 1,
        isActive: true,
      },
    ] as any)

    const clerk1 = { id: "c1", name: "Clerk A", email: "a@test.com", _count: { tasks: 5 } }
    const clerk2 = { id: "c2", name: "Clerk B", email: "b@test.com", _count: { tasks: 2 } }
    mockDb.user.findMany.mockResolvedValue([clerk1, clerk2] as any)

    const result = await findBestAssignee(mockDb, "INSPECTION")

    expect(result).not.toBeNull()
    expect(result!.userId).toBe("c2") // least loaded
    expect(result!.reason).toContain("CLERK")
    expect(result!.reason).toContain("least loaded")
  })

  it("falls back to default role mapping when no rules exist", async () => {
    mockDb.taskAssignmentRule.findMany.mockResolvedValue([] as any)

    const clerkUser = { id: "c1", name: "Default Clerk", email: "c@test.com", _count: { tasks: 0 } }
    mockDb.user.findMany.mockResolvedValue([clerkUser] as any)

    const result = await findBestAssignee(mockDb, "DOCUMENTATION")

    expect(result).not.toBeNull()
    expect(result!.userId).toBe("c1")
    expect(result!.reason).toContain("default mapping")
  })

  it("falls back to project team when no role users found", async () => {
    mockDb.taskAssignmentRule.findMany.mockResolvedValue([] as any)
    mockDb.user.findMany.mockResolvedValue([] as any)

    const teamMember = { id: "tm-1", name: "Team Lead" }
    mockDb.user.findFirst.mockResolvedValue(teamMember as any)

    const result = await findBestAssignee(mockDb, "DOCUMENTATION", ["tm-1"])

    expect(result).not.toBeNull()
    expect(result!.userId).toBe("tm-1")
    expect(result!.reason).toContain("project team member")
  })

  it("returns null when no one is available", async () => {
    mockDb.taskAssignmentRule.findMany.mockResolvedValue([] as any)
    mockDb.user.findMany.mockResolvedValue([] as any)

    const result = await findBestAssignee(mockDb, "DOCUMENTATION")

    expect(result).toBeNull()
  })

  it("skips rules where roleTarget yields no users and continues to next rule", async () => {
    mockDb.taskAssignmentRule.findMany.mockResolvedValue([
      { id: "r1", category: "PAYMENT", userId: null, user: null, roleTarget: "CLERK", priority: 1, isActive: true },
      { id: "r2", category: "PAYMENT", userId: null, user: null, roleTarget: "MANAGER", priority: 2, isActive: true },
    ] as any)

    // First call (CLERK) returns empty, second call (MANAGER) returns a user
    mockDb.user.findMany
      .mockResolvedValueOnce([] as any)
      .mockResolvedValueOnce([{ id: "mgr-1", name: "Manager", email: "m@t.com", _count: { tasks: 1 } }] as any)

    const result = await findBestAssignee(mockDb, "PAYMENT")

    expect(result).not.toBeNull()
    expect(result!.userId).toBe("mgr-1")
    expect(result!.reason).toContain("MANAGER")
  })
})

// =============================================================================
// autoAssignTask
// =============================================================================

describe("autoAssignTask", () => {
  it("skips tasks that are already assigned", async () => {
    const task = { id: "t-1", category: "DOCUMENTATION" as const, projectId: "p-1", assignedTo: ["existing-user"] }

    const result = await autoAssignTask(mockDb, task)

    expect(result.taskId).toBe("t-1")
    expect(result.assignedUserId).toBe("existing-user")
    expect(result.reason).toBe("Already assigned")
    expect(mockDb.taskAssignmentRule.findMany).not.toHaveBeenCalled()
  })

  it("assigns and updates the task in the database", async () => {
    const task = { id: "t-2", category: "INSPECTION" as const, projectId: "p-1", assignedTo: [] as string[] }

    mockDb.taskAssignmentRule.findMany.mockResolvedValue([] as any)
    mockDb.user.findMany.mockResolvedValue([
      { id: "u-1", name: "Inspector", email: "i@t.com", _count: { tasks: 0 } },
    ] as any)
    mockDb.task.update.mockResolvedValue({} as any)

    const result = await autoAssignTask(mockDb, task)

    expect(result.taskId).toBe("t-2")
    expect(result.assignedUserId).toBe("u-1")
    expect(result.assignedUserName).toBe("Inspector")
    expect(mockDb.task.update).toHaveBeenCalledWith({
      where: { id: "t-2" },
      data: { assignedTo: ["u-1"] },
    })
  })

  it("returns null assignee when no suitable user found", async () => {
    const task = { id: "t-3", category: "GENERAL" as const, projectId: null, assignedTo: [] as string[] }

    mockDb.taskAssignmentRule.findMany.mockResolvedValue([] as any)
    mockDb.user.findMany.mockResolvedValue([] as any)

    const result = await autoAssignTask(mockDb, task)

    expect(result.assignedUserId).toBeNull()
    expect(result.reason).toBe("No suitable assignee found")
    expect(mockDb.task.update).not.toHaveBeenCalled()
  })
})

// =============================================================================
// autoAssignTasks (batch)
// =============================================================================

describe("autoAssignTasks", () => {
  it("processes multiple tasks and returns results for each", async () => {
    const tasks = [
      { id: "t-a", category: "DOCUMENTATION" as const, projectId: "p-1", assignedTo: ["existing"] },
      { id: "t-b", category: "INSPECTION" as const, projectId: "p-1", assignedTo: [] as string[] },
    ]

    mockDb.taskAssignmentRule.findMany.mockResolvedValue([] as any)
    mockDb.user.findMany.mockResolvedValue([
      { id: "u-5", name: "Worker", email: "w@t.com", _count: { tasks: 0 } },
    ] as any)
    mockDb.task.update.mockResolvedValue({} as any)

    const results = await autoAssignTasks(mockDb, tasks)

    expect(results).toHaveLength(2)
    expect(results[0]!.reason).toBe("Already assigned")
    expect(results[1]!.assignedUserId).toBe("u-5")
  })

  it("returns empty array for empty input", async () => {
    const results = await autoAssignTasks(mockDb, [])
    expect(results).toEqual([])
  })
})

// =============================================================================
// getAssignmentStats
// =============================================================================

describe("getAssignmentStats", () => {
  it("returns user loads and category breakdown", async () => {
    mockDb.user.findMany.mockResolvedValue([
      { id: "u-1", name: "A", role: "CLERK", _count: { tasks: 3 } },
      { id: "u-2", name: "B", role: "MANAGER", _count: { tasks: 7 } },
    ] as any)

    mockDb.task.groupBy.mockResolvedValue([
      { category: "DOCUMENTATION", _count: 5 },
      { category: "PAYMENT", _count: 2 },
    ] as any)

    const stats = await getAssignmentStats(mockDb)

    expect(stats.userLoads).toHaveLength(2)
    expect(stats.userLoads[0]!.activeTasks).toBe(3)
    expect(stats.categoryBreakdown).toHaveLength(2)
    expect(stats.categoryBreakdown[0]!.category).toBe("DOCUMENTATION")
    expect(stats.categoryBreakdown[0]!.count).toBe(5)
  })
})

// =============================================================================
// upsertAssignmentRule
// =============================================================================

describe("upsertAssignmentRule", () => {
  it("creates a new rule when none exists", async () => {
    mockDb.taskAssignmentRule.findFirst.mockResolvedValue(null as any)
    mockDb.taskAssignmentRule.create.mockResolvedValue({ id: "new-rule" } as any)

    await upsertAssignmentRule(mockDb, {
      category: "DOCUMENTATION",
      roleTarget: "CLERK",
      description: "Docs to clerks",
    })

    expect(mockDb.taskAssignmentRule.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        category: "DOCUMENTATION",
        roleTarget: "CLERK",
        priority: 100,
        isActive: true,
        description: "Docs to clerks",
      }),
    })
  })

  it("updates existing rule when one is found", async () => {
    mockDb.taskAssignmentRule.findFirst.mockResolvedValue({ id: "existing-rule" } as any)
    mockDb.taskAssignmentRule.update.mockResolvedValue({ id: "existing-rule" } as any)

    await upsertAssignmentRule(mockDb, {
      category: "PAYMENT",
      userId: "user-99",
      priority: 10,
    })

    expect(mockDb.taskAssignmentRule.update).toHaveBeenCalledWith({
      where: { id: "existing-rule" },
      data: expect.objectContaining({
        userId: "user-99",
        priority: 10,
      }),
    })
    expect(mockDb.taskAssignmentRule.create).not.toHaveBeenCalled()
  })

  it("uses provided priority and isActive values", async () => {
    mockDb.taskAssignmentRule.findFirst.mockResolvedValue(null as any)
    mockDb.taskAssignmentRule.create.mockResolvedValue({ id: "r" } as any)

    await upsertAssignmentRule(mockDb, {
      category: "INSPECTION",
      priority: 5,
      isActive: false,
    })

    expect(mockDb.taskAssignmentRule.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        priority: 5,
        isActive: false,
      }),
    })
  })
})
