"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  IconPlayerTrackNext,
  IconRefresh,
  IconCopy,
  IconCheck,
  IconLoader2,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { advanceToNextStage, initializeTrackingStages } from "@/actions/tracking"
import { getCurrentStage, getNextStage, STAGE_ORDER } from "@/lib/tracking"
import type { TrackingStage } from "@prisma/client"
import type { Dictionary } from "@/components/internationalization/types"

interface TrackingAdminControlsProps {
  shipmentId: string
  trackingNumber: string | null
  stages: TrackingStage[]
  dictionary: Dictionary
  locale: string
}

export function TrackingAdminControls({
  shipmentId,
  trackingNumber,
  stages,
  dictionary,
  locale,
}: TrackingAdminControlsProps) {
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const hasStages = stages.length > 0
  const currentStage = hasStages ? getCurrentStage(stages) : null
  const nextStage = currentStage ? getNextStage(currentStage) : STAGE_ORDER[0]

  const handleInitialize = () => {
    startTransition(async () => {
      try {
        const result = await initializeTrackingStages(shipmentId)
        toast.success(`${dictionary.tracking?.initializeSuccess ?? "Tracking initialized. Number:"} ${result.trackingNumber}`)
      } catch {
        toast.error(dictionary.tracking?.initializeFailed ?? "Failed to initialize tracking")
      }
    })
  }

  const handleAdvance = () => {
    startTransition(async () => {
      try {
        const result = await advanceToNextStage(shipmentId)
        toast.success(
          `Completed: ${dictionary.tracking.stages[result.completedStage as keyof typeof dictionary.tracking.stages]}`
        )
      } catch {
        toast.error(dictionary.tracking?.advanceFailed ?? "Failed to advance stage")
      }
    })
  }

  const copyTrackingLink = async () => {
    if (!trackingNumber) return
    const url = `${window.location.origin}/${locale}/track/${trackingNumber}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success(dictionary.tracking.linkCopied)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{dictionary.tracking.actions.updateStage}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasStages ? (
          <Button onClick={handleInitialize} disabled={isPending} className="w-full">
            {isPending ? (
              <IconLoader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <IconRefresh className="me-2 h-4 w-4" />
            )}
            {dictionary.tracking.actions.initializeTracking}
          </Button>
        ) : (
          <>
            {/* Copy Tracking Link */}
            {trackingNumber && (
              <Button
                variant="outline"
                onClick={copyTrackingLink}
                className="w-full justify-start"
              >
                {copied ? (
                  <IconCheck className="me-2 h-4 w-4" />
                ) : (
                  <IconCopy className="me-2 h-4 w-4" />
                )}
                {trackingNumber}
              </Button>
            )}

            {/* Advance Stage Button */}
            {nextStage && (
              <Button
                onClick={handleAdvance}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <IconLoader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <IconPlayerTrackNext className="me-2 h-4 w-4" />
                )}
                {dictionary.tracking.actions.advanceStage}
              </Button>
            )}

            {/* Current Stage Info */}
            {currentStage && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{dictionary.tracking.currentStatus}:</span>{" "}
                {dictionary.tracking.stages[currentStage as keyof typeof dictionary.tracking.stages]}
              </div>
            )}

            {/* Next Stage Info */}
            {nextStage && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{dictionary.common.next}:</span>{" "}
                {dictionary.tracking.stages[nextStage as keyof typeof dictionary.tracking.stages]}
              </div>
            )}

            {/* All stages completed */}
            {!nextStage && currentStage === "DELIVERED" && (
              <div className="rounded-md bg-green-50 p-3 text-center text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                {dictionary.tracking.stageDescriptions.DELIVERED}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
