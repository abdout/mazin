import { describe, it, expect } from "vitest"
import { STAGE_SEQUENCE, prerequisites, stageIndex } from "@/components/platform/shipments/stage-machine"

describe("shipment stage machine", () => {
  it("has 11 canonical stages in order", () => {
    expect(STAGE_SEQUENCE).toHaveLength(11)
    expect(STAGE_SEQUENCE[0]).toBe("PRE_ARRIVAL_DOCS")
    expect(STAGE_SEQUENCE[10]).toBe("DELIVERED")
  })

  it("stageIndex returns correct positions", () => {
    expect(stageIndex("PRE_ARRIVAL_DOCS")).toBe(0)
    expect(stageIndex("CUSTOMS_DECLARATION")).toBe(2)
    expect(stageIndex("DELIVERED")).toBe(10)
  })

  it("first stage has no prerequisites", () => {
    expect(prerequisites("PRE_ARRIVAL_DOCS")).toEqual([])
  })

  it("CUSTOMS_PAYMENT requires vessel arrival + declaration", () => {
    const prereq = prerequisites("CUSTOMS_PAYMENT")
    expect(prereq).toContain("PRE_ARRIVAL_DOCS")
    expect(prereq).toContain("VESSEL_ARRIVAL")
    expect(prereq).toContain("CUSTOMS_DECLARATION")
    expect(prereq).not.toContain("CUSTOMS_PAYMENT")
  })

  it("DELIVERED requires all 10 prior stages", () => {
    expect(prerequisites("DELIVERED")).toHaveLength(10)
  })
})
