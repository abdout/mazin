"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Check, Circle, CircleDashed, MinusCircle } from "lucide-react"
import type { TrackingStage, TrackingStageStatus, TrackingStageType } from "@prisma/client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { transitionStage } from "./actions"
import { STAGE_SEQUENCE } from "./stage-machine"

const BILLABLE_STAGES: TrackingStageType[] = [
  "CUSTOMS_PAYMENT",
  "PORT_FEES",
  "INSPECTION",
  "QUALITY_STANDARDS",
  "RELEASE",
]

function statusIcon(status: TrackingStageStatus) {
  switch (status) {
    case "COMPLETED":
      return <Check className="h-4 w-4 text-green-600" />
    case "IN_PROGRESS":
      return <Circle className="h-4 w-4 fill-current text-blue-600" />
    case "SKIPPED":
      return <MinusCircle className="h-4 w-4 text-muted-foreground" />
    default:
      return <CircleDashed className="h-4 w-4 text-muted-foreground" />
  }
}

export function StageTimeline({
  shipmentId,
  stages,
}: {
  shipmentId: string
  stages: TrackingStage[]
}) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<TrackingStageType | null>(null)

  const byType = new Map(stages.map(s => [s.stageType, s]))

  function onTransition(stageType: TrackingStageType, status: TrackingStageStatus) {
    startTransition(async () => {
      try {
        await transitionStage({ shipmentId, stageType, status })
        toast.success(`${stageType} → ${status}`)
        setEditing(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed")
      }
    })
  }

  return (
    <ol className="space-y-3">
      {STAGE_SEQUENCE.map(stageType => {
        const stage = byType.get(stageType)
        const status = stage?.status ?? "PENDING"
        return (
          <li
            key={stageType}
            className="flex items-center justify-between gap-4 border rounded-md p-3"
          >
            <div className="flex items-center gap-3">
              {statusIcon(status)}
              <div>
                <p className="font-medium">{stageType.replace(/_/g, " ")}</p>
                {stage?.completedAt && (
                  <p className="text-xs text-muted-foreground">
                    Completed {new Date(stage.completedAt).toLocaleString()}
                  </p>
                )}
              </div>
              {BILLABLE_STAGES.includes(stageType) && stage?.paymentRequested && (
                <Badge variant="outline" className="text-[10px]">
                  Invoiced
                </Badge>
              )}
            </div>

            {editing === stageType ? (
              <div className="flex items-center gap-2">
                <Select
                  defaultValue={status}
                  onValueChange={v => onTransition(stageType, v as TrackingStageStatus)}
                >
                  <SelectTrigger className="w-36" disabled={isPending}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="SKIPPED">Skipped</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEditing(stageType)}>
                Update
              </Button>
            )}
          </li>
        )
      })}
    </ol>
  )
}
