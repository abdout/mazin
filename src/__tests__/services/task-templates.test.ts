import { describe, it, expect } from "vitest"
import {
  STAGE_TO_CATEGORY,
  mapStageToCategory,
  getTasksForStage,
  getCategoryForStage,
  getStagesForCategory,
} from "@/lib/services/task-templates"
import type { TrackingStageType, TaskCategory } from "@prisma/client"

const ALL_STAGES: TrackingStageType[] = [
  "PRE_ARRIVAL_DOCS",
  "VESSEL_ARRIVAL",
  "CUSTOMS_DECLARATION",
  "CUSTOMS_PAYMENT",
  "INSPECTION",
  "PORT_FEES",
  "QUALITY_STANDARDS",
  "RELEASE",
  "LOADING",
  "IN_TRANSIT",
  "DELIVERED",
]

// =============================================================================
// STAGE_TO_CATEGORY
// =============================================================================

describe("STAGE_TO_CATEGORY", () => {
  it("maps all 11 tracking stages", () => {
    for (const stage of ALL_STAGES) {
      expect(STAGE_TO_CATEGORY[stage]).toBeDefined()
    }
  })

  it("maps to valid TaskCategory values", () => {
    const validCategories: TaskCategory[] = [
      "DOCUMENTATION",
      "CUSTOMS_DECLARATION",
      "PAYMENT",
      "INSPECTION",
      "RELEASE",
      "DELIVERY",
      "GENERAL",
    ]
    for (const stage of ALL_STAGES) {
      expect(validCategories).toContain(STAGE_TO_CATEGORY[stage])
    }
  })

  it("maps documentation stages correctly", () => {
    expect(STAGE_TO_CATEGORY.PRE_ARRIVAL_DOCS).toBe("DOCUMENTATION")
    expect(STAGE_TO_CATEGORY.VESSEL_ARRIVAL).toBe("DOCUMENTATION")
  })

  it("maps payment stages correctly", () => {
    expect(STAGE_TO_CATEGORY.CUSTOMS_PAYMENT).toBe("PAYMENT")
    expect(STAGE_TO_CATEGORY.PORT_FEES).toBe("PAYMENT")
  })

  it("maps inspection stages correctly", () => {
    expect(STAGE_TO_CATEGORY.INSPECTION).toBe("INSPECTION")
    expect(STAGE_TO_CATEGORY.QUALITY_STANDARDS).toBe("INSPECTION")
  })

  it("maps delivery stages correctly", () => {
    expect(STAGE_TO_CATEGORY.LOADING).toBe("DELIVERY")
    expect(STAGE_TO_CATEGORY.IN_TRANSIT).toBe("DELIVERY")
    expect(STAGE_TO_CATEGORY.DELIVERED).toBe("DELIVERY")
  })

  it("maps CUSTOMS_DECLARATION to CUSTOMS_DECLARATION", () => {
    expect(STAGE_TO_CATEGORY.CUSTOMS_DECLARATION).toBe("CUSTOMS_DECLARATION")
  })

  it("maps RELEASE to RELEASE", () => {
    expect(STAGE_TO_CATEGORY.RELEASE).toBe("RELEASE")
  })
})

// =============================================================================
// mapStageToCategory
// =============================================================================

describe("mapStageToCategory", () => {
  describe("documentation keywords", () => {
    it("maps 'document processing' to DOCUMENTATION", () => {
      expect(mapStageToCategory("document processing")).toBe("DOCUMENTATION")
    })

    it("maps 'pre-arrival checks' to DOCUMENTATION", () => {
      expect(mapStageToCategory("pre-arrival checks")).toBe("DOCUMENTATION")
    })

    it("maps 'pre arrival docs' to DOCUMENTATION", () => {
      expect(mapStageToCategory("pre arrival docs")).toBe("DOCUMENTATION")
    })

    it("maps 'BL verification' to DOCUMENTATION", () => {
      expect(mapStageToCategory("BL verification")).toBe("DOCUMENTATION")
    })

    it("maps 'commercial invoice check' to DOCUMENTATION", () => {
      expect(mapStageToCategory("commercial invoice check")).toBe("DOCUMENTATION")
    })

    it("maps 'packing list' to DOCUMENTATION", () => {
      expect(mapStageToCategory("packing list")).toBe("DOCUMENTATION")
    })
  })

  describe("customs declaration keywords", () => {
    it("maps 'customs declaration' to CUSTOMS_DECLARATION", () => {
      expect(mapStageToCategory("customs declaration")).toBe("CUSTOMS_DECLARATION")
    })

    it("maps 'tariff classification' to CUSTOMS_DECLARATION", () => {
      expect(mapStageToCategory("tariff classification")).toBe("CUSTOMS_DECLARATION")
    })

    it("maps 'Declaration Filing' to CUSTOMS_DECLARATION (case-insensitive)", () => {
      expect(mapStageToCategory("Declaration Filing")).toBe("CUSTOMS_DECLARATION")
    })
  })

  describe("payment keywords", () => {
    it("maps 'duty payment' to PAYMENT", () => {
      expect(mapStageToCategory("duty payment")).toBe("PAYMENT")
    })

    it("maps 'fee processing' to PAYMENT", () => {
      expect(mapStageToCategory("fee processing")).toBe("PAYMENT")
    })

    it("maps 'tax calculation' to PAYMENT", () => {
      expect(mapStageToCategory("tax calculation")).toBe("PAYMENT")
    })

    it("maps 'vat payment' to PAYMENT", () => {
      expect(mapStageToCategory("vat payment")).toBe("PAYMENT")
    })
  })

  describe("inspection keywords", () => {
    it("maps 'physical inspection' to INSPECTION", () => {
      expect(mapStageToCategory("physical inspection")).toBe("INSPECTION")
    })

    it("maps 'quality check' to INSPECTION", () => {
      expect(mapStageToCategory("quality check")).toBe("INSPECTION")
    })

    it("maps 'SSMO certification' to INSPECTION", () => {
      expect(mapStageToCategory("SSMO certification")).toBe("INSPECTION")
    })

    it("maps 'standards compliance' to INSPECTION", () => {
      expect(mapStageToCategory("standards compliance")).toBe("INSPECTION")
    })

    it("maps 'quarantine check' to INSPECTION", () => {
      expect(mapStageToCategory("quarantine check")).toBe("INSPECTION")
    })
  })

  describe("release keywords", () => {
    it("maps 'cargo release' to RELEASE", () => {
      expect(mapStageToCategory("cargo release")).toBe("RELEASE")
    })

    it("maps 'final clearance' to RELEASE", () => {
      // Note: "customs clearance" matches CUSTOMS_DECLARATION because "customs" is checked first
      expect(mapStageToCategory("final clearance")).toBe("RELEASE")
    })

    it("maps 'gate pass' to RELEASE", () => {
      expect(mapStageToCategory("gate pass")).toBe("RELEASE")
    })
  })

  describe("delivery keywords", () => {
    it("maps 'final delivery' to DELIVERY", () => {
      expect(mapStageToCategory("final delivery")).toBe("DELIVERY")
    })

    it("maps 'cargo transport' to DELIVERY", () => {
      expect(mapStageToCategory("cargo transport")).toBe("DELIVERY")
    })

    it("maps 'container loading' to DELIVERY", () => {
      expect(mapStageToCategory("container loading")).toBe("DELIVERY")
    })

    it("maps 'in transit' to DELIVERY", () => {
      expect(mapStageToCategory("in transit")).toBe("DELIVERY")
    })

    it("maps 'truck dispatch' to DELIVERY", () => {
      expect(mapStageToCategory("truck dispatch")).toBe("DELIVERY")
    })
  })

  describe("fallback", () => {
    it("returns GENERAL for unrecognized stage names", () => {
      expect(mapStageToCategory("something random")).toBe("GENERAL")
    })

    it("returns GENERAL for empty string", () => {
      expect(mapStageToCategory("")).toBe("GENERAL")
    })
  })
})

// =============================================================================
// getTasksForStage
// =============================================================================

describe("getTasksForStage", () => {
  it("returns tasks for every tracking stage", () => {
    for (const stage of ALL_STAGES) {
      const tasks = getTasksForStage(stage)
      expect(Array.isArray(tasks)).toBe(true)
      expect(tasks.length).toBeGreaterThan(0)
    }
  })

  it("each task has title, description, and estimatedHours", () => {
    for (const stage of ALL_STAGES) {
      const tasks = getTasksForStage(stage)
      for (const task of tasks) {
        expect(typeof task.title).toBe("string")
        expect(task.title.length).toBeGreaterThan(0)
        expect(typeof task.description).toBe("string")
        expect(task.description.length).toBeGreaterThan(0)
        expect(typeof task.estimatedHours).toBe("number")
        expect(task.estimatedHours).toBeGreaterThan(0)
      }
    }
  })

  it("PRE_ARRIVAL_DOCS has 4 tasks", () => {
    expect(getTasksForStage("PRE_ARRIVAL_DOCS")).toHaveLength(4)
  })

  it("DELIVERED has 3 tasks", () => {
    expect(getTasksForStage("DELIVERED")).toHaveLength(3)
  })

  it("VESSEL_ARRIVAL has 2 tasks", () => {
    expect(getTasksForStage("VESSEL_ARRIVAL")).toHaveLength(2)
  })
})

// =============================================================================
// getCategoryForStage
// =============================================================================

describe("getCategoryForStage", () => {
  it("returns the same value as STAGE_TO_CATEGORY for known stages", () => {
    for (const stage of ALL_STAGES) {
      expect(getCategoryForStage(stage)).toBe(STAGE_TO_CATEGORY[stage])
    }
  })
})

// =============================================================================
// getStagesForCategory
// =============================================================================

describe("getStagesForCategory", () => {
  it("returns documentation stages for DOCUMENTATION", () => {
    const stages = getStagesForCategory("DOCUMENTATION")
    expect(stages).toContain("PRE_ARRIVAL_DOCS")
    expect(stages).toContain("VESSEL_ARRIVAL")
    expect(stages).toHaveLength(2)
  })

  it("returns payment stages for PAYMENT", () => {
    const stages = getStagesForCategory("PAYMENT")
    expect(stages).toContain("CUSTOMS_PAYMENT")
    expect(stages).toContain("PORT_FEES")
    expect(stages).toHaveLength(2)
  })

  it("returns inspection stages for INSPECTION", () => {
    const stages = getStagesForCategory("INSPECTION")
    expect(stages).toContain("INSPECTION")
    expect(stages).toContain("QUALITY_STANDARDS")
    expect(stages).toHaveLength(2)
  })

  it("returns delivery stages for DELIVERY", () => {
    const stages = getStagesForCategory("DELIVERY")
    expect(stages).toContain("LOADING")
    expect(stages).toContain("IN_TRANSIT")
    expect(stages).toContain("DELIVERED")
    expect(stages).toHaveLength(3)
  })

  it("returns single stage for CUSTOMS_DECLARATION", () => {
    const stages = getStagesForCategory("CUSTOMS_DECLARATION")
    expect(stages).toEqual(["CUSTOMS_DECLARATION"])
  })

  it("returns single stage for RELEASE", () => {
    const stages = getStagesForCategory("RELEASE")
    expect(stages).toEqual(["RELEASE"])
  })

  it("returns empty array for GENERAL (no stage maps to it)", () => {
    const stages = getStagesForCategory("GENERAL")
    expect(stages).toEqual([])
  })
})
