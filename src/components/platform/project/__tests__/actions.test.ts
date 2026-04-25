import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/services/project-cascade", () => ({
  executeProjectCascade: vi.fn().mockResolvedValue({ shipmentId: "s-1", stagesCreated: 11 }),
}))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} from "../actions"
import { makeSession, makeProject } from "@/__tests__/helpers/factories"

const USER_A = "user-a"
const USER_B = "user-b"
const PROJECT_ID = "proj-1"

describe("project actions — tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(
      makeSession({ user: { id: USER_A, role: "ADMIN", name: "A", email: "a@t" } }) as any
    )
  })

  describe("getProjects", () => {
    it("filters findMany by session.user.id", async () => {
      vi.mocked(db.project.findMany).mockResolvedValue([] as any)
      await getProjects()
      expect(db.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_A },
        })
      )
    })

    it("returns error when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any)
      const result = await getProjects()
      expect(result.success).toBe(false)
      expect(db.project.findMany).not.toHaveBeenCalled()
    })
  })

  describe("getProject", () => {
    it("uses findFirst with { id, userId }", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue(
        makeProject({ id: PROJECT_ID, userId: USER_A }) as any
      )
      await getProject(PROJECT_ID)
      expect(db.project.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PROJECT_ID, userId: USER_A },
        })
      )
    })

    it("returns 'not found' when the project belongs to another user", async () => {
      // Cross-user probe: user A asks for user B's project; findFirst returns null
      // because the userId filter doesn't match.
      vi.mocked(db.project.findFirst).mockResolvedValue(null as any)
      const result = await getProject(PROJECT_ID)
      expect(result.success).toBe(false)
      expect(result.error).toBe("Project not found")
    })
  })

  describe("updateProject", () => {
    it("ownership-probes before mutating", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue({ id: PROJECT_ID } as any)
      vi.mocked(db.project.update).mockResolvedValue(
        makeProject({ id: PROJECT_ID, userId: USER_A }) as any
      )
      await updateProject(PROJECT_ID, { customer: "New Corp" })
      expect(db.project.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PROJECT_ID, userId: USER_A },
        })
      )
      expect(db.project.update).toHaveBeenCalled()
    })

    it("refuses to update a project owned by a different user", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue(null as any)
      const result = await updateProject(PROJECT_ID, { customer: "Hijack Corp" })
      expect(result.success).toBe(false)
      expect(db.project.update).not.toHaveBeenCalled()
    })

    it("rejects null data", async () => {
      const result = await updateProject(PROJECT_ID, null)
      expect(result.success).toBe(false)
      expect(db.project.findFirst).not.toHaveBeenCalled()
    })
  })

  describe("deleteProject", () => {
    it("ownership-probes before deleting", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue({ id: PROJECT_ID } as any)
      vi.mocked(db.project.delete).mockResolvedValue(
        makeProject({ id: PROJECT_ID, userId: USER_A }) as any
      )
      const result = await deleteProject(PROJECT_ID)
      expect(result.success).toBe(true)
      expect(db.project.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PROJECT_ID, userId: USER_A },
        })
      )
    })

    it("does not delete another user's project", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue(null as any)
      const result = await deleteProject(PROJECT_ID)
      expect(result.success).toBe(false)
      expect(db.project.delete).not.toHaveBeenCalled()
    })
  })

  describe("session wiring", () => {
    it("uses the currently authenticated user, not a param", async () => {
      vi.mocked(auth).mockResolvedValueOnce(
        makeSession({ user: { id: USER_B, role: "ADMIN", name: "B", email: "b@t" } }) as any
      )
      vi.mocked(db.project.findMany).mockResolvedValue([] as any)
      await getProjects()
      expect(db.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_B } })
      )
    })
  })
})
