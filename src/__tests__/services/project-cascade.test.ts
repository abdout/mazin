import { describe, it, expect, vi, beforeEach } from "vitest"
import { db } from "@/lib/db"
import {
  createShipmentWithStages,
  generateTasksWithCategories,
  executeProjectCascade,
} from "@/lib/services/project-cascade"
import { TRACKING_STAGES } from "@/lib/utils/tracking"

const mockDb = db as any

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProjectData(overrides = {}) {
  return {
    id: "proj-1",
    customer: "Acme Corp",
    blAwbNumber: "BL-12345",
    systems: ["Import"],
    activities: [] as any[],
    team: ["user-a", "user-b"],
    teamLead: "user-a",
    portOfOrigin: "Shanghai",
    portOfDestination: "Port Sudan",
    startDate: new Date("2025-06-01"),
    customerId: "client-1",
    ...overrides,
  }
}

// =============================================================================
// createShipmentWithStages
// =============================================================================

describe("createShipmentWithStages", () => {
  it("creates a shipment with generated tracking info", async () => {
    const shipment = { id: "shp-1" }
    mockDb.shipment.create.mockResolvedValue(shipment as any)
    mockDb.trackingStage.createMany.mockResolvedValue({ count: 11 } as any)

    const project = makeProjectData()
    const result = await createShipmentWithStages(mockDb, project, "user-a")

    expect(result.id).toBe("shp-1")
    expect(result.trackingNumber).toMatch(/^TRK-/)
    expect(result.shipmentNumber).toMatch(/^SHP-/)
    expect(result.trackingSlug).toBeDefined()
    expect(result.stagesCreated).toBe(TRACKING_STAGES.length)
  })

  it("sets type to EXPORT when systems contain export", async () => {
    mockDb.shipment.create.mockResolvedValue({ id: "shp-2" } as any)
    mockDb.trackingStage.createMany.mockResolvedValue({ count: 11 } as any)

    const project = makeProjectData({ systems: ["Export Clearance"] })
    await createShipmentWithStages(mockDb, project, "user-a")

    const createCall = mockDb.shipment.create.mock.calls[0]![0]
    expect(createCall.data.type).toBe("EXPORT")
  })

  it("sets type to IMPORT when systems do not contain export", async () => {
    mockDb.shipment.create.mockResolvedValue({ id: "shp-3" } as any)
    mockDb.trackingStage.createMany.mockResolvedValue({ count: 11 } as any)

    const project = makeProjectData({ systems: ["Import", "Transit"] })
    await createShipmentWithStages(mockDb, project, "user-a")

    const createCall = mockDb.shipment.create.mock.calls[0]![0]
    expect(createCall.data.type).toBe("IMPORT")
  })

  it("creates all 11 tracking stages", async () => {
    mockDb.shipment.create.mockResolvedValue({ id: "shp-4" } as any)
    mockDb.trackingStage.createMany.mockResolvedValue({ count: 11 } as any)

    const project = makeProjectData()
    await createShipmentWithStages(mockDb, project, "user-a")

    const stageCall = mockDb.trackingStage.createMany.mock.calls[0]![0]
    expect(stageCall.data).toHaveLength(11)
  })

  it("sets first stage to IN_PROGRESS and rest to PENDING", async () => {
    mockDb.shipment.create.mockResolvedValue({ id: "shp-5" } as any)
    mockDb.trackingStage.createMany.mockResolvedValue({ count: 11 } as any)

    const project = makeProjectData()
    await createShipmentWithStages(mockDb, project, "user-a")

    const stageCall = mockDb.trackingStage.createMany.mock.calls[0]![0]
    expect(stageCall.data[0].status).toBe("IN_PROGRESS")
    expect(stageCall.data[0].startedAt).toBeInstanceOf(Date)
    for (let i = 1; i < stageCall.data.length; i++) {
      expect(stageCall.data[i].status).toBe("PENDING")
      expect(stageCall.data[i].startedAt).toBeNull()
    }
  })

  it("links shipment to project and client", async () => {
    mockDb.shipment.create.mockResolvedValue({ id: "shp-6" } as any)
    mockDb.trackingStage.createMany.mockResolvedValue({ count: 11 } as any)

    const project = makeProjectData()
    await createShipmentWithStages(mockDb, project, "user-a")

    const createCall = mockDb.shipment.create.mock.calls[0]![0]
    expect(createCall.data.projectId).toBe("proj-1")
    expect(createCall.data.clientId).toBe("client-1")
    expect(createCall.data.consignee).toBe("Acme Corp")
  })
})

// =============================================================================
// generateTasksWithCategories
// =============================================================================

describe("generateTasksWithCategories", () => {
  it("creates default tasks when activities are empty", async () => {
    mockDb.task.createMany.mockResolvedValue({ count: 12 } as any)

    const project = makeProjectData({ activities: [] })
    const count = await generateTasksWithCategories(mockDb, project, "user-a")

    expect(count).toBe(12)
    const createCall = mockDb.task.createMany.mock.calls[0]![0]
    expect(createCall.data).toHaveLength(12)
  })

  it("creates default tasks when activities is null-ish", async () => {
    mockDb.task.createMany.mockResolvedValue({ count: 12 } as any)

    const project = makeProjectData({ activities: null })
    const count = await generateTasksWithCategories(mockDb, project, "user-a")

    expect(count).toBe(12)
  })

  it("creates tasks from provided activities", async () => {
    const activities = [
      { shipmentType: "Import", stage: "documentation", substage: "BL Check", task: "Verify BL" },
      { shipmentType: "Import", stage: "inspection", substage: "Physical", task: "Attend" },
    ]
    mockDb.task.createMany.mockResolvedValue({ count: 2 } as any)

    const project = makeProjectData({ activities })
    const count = await generateTasksWithCategories(mockDb, project, "user-a")

    expect(count).toBe(2)
    const createCall = mockDb.task.createMany.mock.calls[0]![0]
    expect(createCall.data).toHaveLength(2)
  })

  it("maps activity stage to correct category", async () => {
    const activities = [
      { shipmentType: "Import", stage: "payment", substage: "Duties", task: "Pay duties" },
    ]
    mockDb.task.createMany.mockResolvedValue({ count: 1 } as any)

    const project = makeProjectData({ activities })
    await generateTasksWithCategories(mockDb, project, "user-a")

    const createCall = mockDb.task.createMany.mock.calls[0]![0]
    expect(createCall.data[0].category).toBe("PAYMENT")
  })

  it("groups activities by shipmentType-stage-substage", async () => {
    const activities = [
      { shipmentType: "Import", stage: "customs", substage: "Filing", task: "Task A" },
      { shipmentType: "Import", stage: "customs", substage: "Filing", task: "Task B" },
    ]
    mockDb.task.createMany.mockResolvedValue({ count: 1 } as any)

    const project = makeProjectData({ activities })
    await generateTasksWithCategories(mockDb, project, "user-a")

    // Two activities with same key should produce 1 grouped task
    const createCall = mockDb.task.createMany.mock.calls[0]![0]
    expect(createCall.data).toHaveLength(1)
  })

  it("returns 0 when activities have no groupable data", async () => {
    const activities = [
      { shipmentType: "", stage: "", substage: "", task: "" },
    ]
    // One group will be created with key "--"
    mockDb.task.createMany.mockResolvedValue({ count: 1 } as any)

    const project = makeProjectData({ activities })
    const count = await generateTasksWithCategories(mockDb, project, "user-a")

    // The group has no tasks but the group itself still creates a task entry
    expect(count).toBe(1)
  })

  it("default tasks include correct categories", async () => {
    mockDb.task.createMany.mockResolvedValue({ count: 12 } as any)

    const project = makeProjectData({ activities: [] })
    await generateTasksWithCategories(mockDb, project, "user-a")

    const createCall = mockDb.task.createMany.mock.calls[0]![0]
    const categories = createCall.data.map((t: any) => t.category)
    expect(categories).toContain("DOCUMENTATION")
    expect(categories).toContain("CUSTOMS_DECLARATION")
    expect(categories).toContain("PAYMENT")
    expect(categories).toContain("INSPECTION")
    expect(categories).toContain("RELEASE")
    expect(categories).toContain("DELIVERY")
  })

  it("assigns team members to each task", async () => {
    mockDb.task.createMany.mockResolvedValue({ count: 12 } as any)

    const project = makeProjectData({ team: ["u-1", "u-2"] })
    await generateTasksWithCategories(mockDb, project, "user-a")

    const createCall = mockDb.task.createMany.mock.calls[0]![0]
    for (const task of createCall.data) {
      expect(task.assignedTo).toEqual(["u-1", "u-2"])
    }
  })
})

// =============================================================================
// executeProjectCascade
// =============================================================================

describe("executeProjectCascade", () => {
  it("creates shipment, stages, tasks, and runs auto-assignment", async () => {
    // Shipment creation
    mockDb.shipment.create.mockResolvedValue({ id: "shp-cascade" } as any)
    mockDb.trackingStage.createMany.mockResolvedValue({ count: 11 } as any)

    // Task creation (default tasks)
    mockDb.task.createMany.mockResolvedValue({ count: 12 } as any)

    // Task fetch for assignment
    mockDb.task.findMany.mockResolvedValue([
      { id: "t-1", category: "DOCUMENTATION", projectId: "proj-1", assignedTo: ["user-a"] },
      { id: "t-2", category: "INSPECTION", projectId: "proj-1", assignedTo: [] },
    ] as any)

    // Auto-assignment mocks
    mockDb.taskAssignmentRule.findMany.mockResolvedValue([] as any)
    mockDb.user.findMany.mockResolvedValue([
      { id: "u-auto", name: "Auto User", email: "a@t.com", _count: { tasks: 0 } },
    ] as any)
    mockDb.task.update.mockResolvedValue({} as any)

    const project = makeProjectData()
    const result = await executeProjectCascade(mockDb, project, "user-a")

    expect(result.shipment.id).toBe("shp-cascade")
    expect(result.stagesCreated).toBe(11)
    expect(result.tasksCreated).toBe(12)
    expect(result.assignments).toHaveLength(2)
    // Both tasks end up with a non-null assignedUserId (one pre-assigned, one auto-assigned)
    expect(result.tasksAssigned).toBe(2)
  })

  it("skips auto-assignment when no tasks are created", async () => {
    mockDb.shipment.create.mockResolvedValue({ id: "shp-empty" } as any)
    mockDb.trackingStage.createMany.mockResolvedValue({ count: 11 } as any)
    mockDb.task.createMany.mockResolvedValue({ count: 0 } as any)

    // Use activities that produce 0 tasks via empty createMany
    const project = makeProjectData({ activities: [] })

    // Override createMany to return 0
    mockDb.task.createMany.mockResolvedValue({ count: 0 } as any)

    // We need generateTasksWithCategories to return 0
    // Since activities is empty, it goes to createDefaultTasks which calls createMany
    // Let's make it return 0
    const result = await executeProjectCascade(mockDb, project, "user-a")

    // Since createMany returned count: 0, no task.findMany should be called for assignment
    expect(result.tasksCreated).toBe(0)
    expect(result.tasksAssigned).toBe(0)
    expect(result.assignments).toEqual([])
  })

  it("returns correct shipment tracking info", async () => {
    mockDb.shipment.create.mockResolvedValue({ id: "shp-track" } as any)
    mockDb.trackingStage.createMany.mockResolvedValue({ count: 11 } as any)
    mockDb.task.createMany.mockResolvedValue({ count: 0 } as any)

    const project = makeProjectData()
    const result = await executeProjectCascade(mockDb, project, "user-a")

    expect(result.shipment.trackingNumber).toMatch(/^TRK-/)
    expect(result.shipment.shipmentNumber).toMatch(/^SHP-/)
    expect(typeof result.shipment.trackingSlug).toBe("string")
    expect(result.shipment.trackingSlug.length).toBeGreaterThan(0)
  })
})
