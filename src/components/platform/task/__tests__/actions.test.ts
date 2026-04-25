import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  getTeamMembers,
  getTasksByProject,
  generateTasksFromProject,
} from "../actions"
import { makeSession, makeTask, makeProject } from "@/__tests__/helpers/factories"

const USER_A = "user-a"
const USER_B = "user-b"
const TASK_ID = "task-1"
const PROJECT_ID = "proj-1"

describe("task actions — tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(
      makeSession({ user: { id: USER_A, role: "ADMIN", name: "A", email: "a@t" } }) as any
    )
  })

  describe("getTasks", () => {
    it("filters findMany by session.user.id", async () => {
      vi.mocked(db.task.findMany).mockResolvedValue([] as any)
      await getTasks()
      expect(db.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_A } })
      )
    })
  })

  describe("getTask", () => {
    it("returns error when the task belongs to another user", async () => {
      vi.mocked(db.task.findFirst).mockResolvedValue(null as any)
      const result = await getTask(TASK_ID)
      expect(result.error).toBe("Task not found")
      expect(db.task.findFirst).toHaveBeenCalledWith({
        where: { id: TASK_ID, userId: USER_A },
      })
    })
  })

  describe("updateTask", () => {
    it("refuses when no owning row matches { id, userId }", async () => {
      vi.mocked(db.task.findFirst).mockResolvedValue(null as any)
      const result = await updateTask(TASK_ID, { task: "Hijack" })
      expect(result.error).toBe("Task not found")
      expect(db.task.update).not.toHaveBeenCalled()
    })

    it("Zod-validates partial input", async () => {
      // 'nonsense' is not a valid status enum → safeParse fails
      const result = await updateTask(TASK_ID, { status: "nonsense" as any })
      expect(result.error).toBe("Invalid task data")
      expect(db.task.findFirst).not.toHaveBeenCalled()
    })

    it("happy path updates via the tenant-scoped existence check", async () => {
      vi.mocked(db.task.findFirst).mockResolvedValue({ id: TASK_ID } as any)
      vi.mocked(db.task.update).mockResolvedValue(
        makeTask({ id: TASK_ID, userId: USER_A, task: "Updated" }) as any
      )
      const result = await updateTask(TASK_ID, { task: "Updated" })
      expect(result.success).toBe(true)
    })
  })

  describe("deleteTask", () => {
    it("refuses to delete another user's task", async () => {
      vi.mocked(db.task.findFirst).mockResolvedValue(null as any)
      const result = await deleteTask(TASK_ID)
      expect(result.error).toBe("Task not found")
      expect(db.task.delete).not.toHaveBeenCalled()
    })
  })

  describe("getTeamMembers", () => {
    it("only surfaces users appearing in the caller's projects", async () => {
      // No projects → only the caller themselves shows up.
      vi.mocked(db.project.findMany).mockResolvedValue([] as any)
      vi.mocked(db.user.findMany).mockResolvedValue([
        { id: USER_A, name: "A" },
      ] as any)
      const result = await getTeamMembers()
      expect(result.success).toBe(true)
      expect(db.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_A } })
      )
      // user.findMany called with id-in-set that includes caller
      const userCall = vi.mocked(db.user.findMany).mock.calls[0]![0] as any
      expect(userCall.where.id.in).toContain(USER_A)
    })

    it("expands to include team + teamLead from owned projects", async () => {
      vi.mocked(db.project.findMany).mockResolvedValue([
        { team: ["u1", "u2"], teamLead: "lead-1" },
      ] as any)
      vi.mocked(db.user.findMany).mockResolvedValue([] as any)
      await getTeamMembers()
      const userCall = vi.mocked(db.user.findMany).mock.calls[0]![0] as any
      expect(userCall.where.id.in).toEqual(
        expect.arrayContaining([USER_A, "u1", "u2", "lead-1"])
      )
    })
  })

  describe("getTasksByProject", () => {
    it("scopes the project-scoped task list to the caller", async () => {
      vi.mocked(db.task.findMany).mockResolvedValue([] as any)
      await getTasksByProject(PROJECT_ID)
      expect(db.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: PROJECT_ID, userId: USER_A },
        })
      )
    })
  })

  describe("generateTasksFromProject", () => {
    it("rejects when the project is owned by another user", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue(null as any)
      const result = await generateTasksFromProject(PROJECT_ID)
      expect(result.error).toBe("Project not found")
      // The tenant-scoped lookup is mandatory.
      expect(db.project.findFirst).toHaveBeenCalledWith({
        where: { id: PROJECT_ID, userId: USER_A },
      })
    })

    it("wraps deleteMany + createMany in a transaction so partial failure keeps old tasks", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue(
        makeProject({
          id: PROJECT_ID,
          userId: USER_A,
          activities: [
            { shipmentType: "sea", stage: "pre-arrival", substage: "docs", task: "Collect BL" },
          ],
        }) as any
      )
      // $transaction fake: run the callback with tx=db, so inner calls are mocked.
      const txSpy = vi.fn(async (cb: any) => cb(db))
      vi.mocked(db.$transaction).mockImplementation(txSpy as any)
      vi.mocked(db.task.deleteMany).mockResolvedValue({ count: 0 } as any)
      vi.mocked(db.task.createMany).mockResolvedValue({ count: 1 } as any)

      await generateTasksFromProject(PROJECT_ID)

      expect(txSpy).toHaveBeenCalled()
      const deleteManyCall = vi.mocked(db.task.deleteMany).mock.calls[0]![0] as any
      // Must scope delete to the caller's userId so a cross-tenant replay cannot
      // wipe another user's tasks via path-equals.
      expect(deleteManyCall.where.userId).toBe(USER_A)
    })
  })
})
