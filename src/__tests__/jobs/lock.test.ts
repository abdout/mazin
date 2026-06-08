import { describe, it, expect, vi, beforeEach } from "vitest"

import { db } from "@/lib/db"
import { withJobLock, notificationDedupKey } from "@/lib/jobs/lock"

describe("withJobLock", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("runs the body when the lock is free and marks SUCCESS", async () => {
    const fakeRow = { id: "run-1" }
    vi.mocked(db.jobRun.create).mockResolvedValue(fakeRow as never)
    vi.mocked(db.jobRun.update).mockResolvedValue(fakeRow as never)

    const result = await withJobLock({
      jobName: "test-job",
      run: async () => 42,
    })

    expect(result.status).toBe("ran")
    expect(result.result).toBe(42)
    expect(db.jobRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "run-1" },
        data: expect.objectContaining({ status: "SUCCESS" }),
      })
    )
  })

  it("skips when (jobName, scheduledFor) is already claimed (P2002)", async () => {
    const conflict = Object.assign(new Error("dup"), { code: "P2002" })
    vi.mocked(db.jobRun.create).mockRejectedValue(conflict)

    const run = vi.fn()
    const result = await withJobLock({ jobName: "test-job", run })

    expect(result.status).toBe("skipped")
    expect(run).not.toHaveBeenCalled()
  })

  it("marks FAILED when the body throws and re-surfaces the error message", async () => {
    const fakeRow = { id: "run-2" }
    vi.mocked(db.jobRun.create).mockResolvedValue(fakeRow as never)
    vi.mocked(db.jobRun.update).mockResolvedValue(fakeRow as never)

    const result = await withJobLock({
      jobName: "test-job",
      run: async () => {
        throw new Error("boom")
      },
    })

    expect(result.status).toBe("failed")
    expect(result.error).toBe("boom")
    expect(db.jobRun.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED", error: "boom" }),
      })
    )
  })
})

describe("notificationDedupKey", () => {
  it("encodes kind, resource, day, and channel", () => {
    const key = notificationDedupKey({
      kind: "demurrage:warning",
      resourceId: "ship-123",
      bucketDay: new Date("2026-04-25T00:00:00Z"),
      channel: "WHATSAPP",
    })
    expect(key).toBe("demurrage:warning:ship-123:2026-04-25:WHATSAPP")
  })

  it("defaults channel to ANY when omitted", () => {
    const key = notificationDedupKey({
      kind: "im-expiry",
      resourceId: "im-1",
      bucketDay: new Date("2026-01-02T12:00:00Z"),
    })
    expect(key).toBe("im-expiry:im-1:2026-01-02:ANY")
  })
})
