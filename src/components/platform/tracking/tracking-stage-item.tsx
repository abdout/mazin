"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconCash, IconCheck, IconClock } from "@tabler/icons-react"
import { STAGE_ICONS, STAGE_CONFIG, STATUS_STYLES, isPayableStage } from "@/lib/tracking"
import type { TrackingStage, TrackingStageType, TrackingStageStatus } from "@prisma/client"
import type { Dictionary } from "@/components/internationalization/types"
import { formatTrackingDate, getRelativeTime } from "@/lib/tracking"

interface TrackingStageItemProps {
  stage: TrackingStage
  isLast: boolean
  dictionary: Dictionary
  locale: string
  showPaymentControls?: boolean
  onRequestPayment?: (stageId: string, stageType: TrackingStageType) => void
}

export function TrackingStageItem({
  stage,
  isLast,
  dictionary,
  locale,
  showPaymentControls = false,
  onRequestPayment,
}: TrackingStageItemProps) {
  const Icon = STAGE_ICONS[stage.stageType]
  const config = STAGE_CONFIG[stage.stageType]
  const styles = STATUS_STYLES[stage.status]
  const isActive = stage.status === "IN_PROGRESS"
  const isCompleted = stage.status === "COMPLETED"
  const canRequestPayment = isPayableStage(stage.stageType) && showPaymentControls

  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      {/* Vertical connector line */}
      {!isLast && (
        <div
          className={cn(
            "absolute start-6 top-12 h-[calc(100%-3rem)] w-0.5",
            isCompleted ? "bg-green-300 dark:bg-green-700" : "bg-gray-200 dark:bg-gray-700"
          )}
        />
      )}

      {/* Icon circle */}
      <div
        className={cn(
          "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          styles.bg,
          styles.text,
          styles.border,
          isActive && "animate-pulse ring-4 ring-blue-200 dark:ring-blue-900"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content card */}
      <Card className={cn("flex-1", isActive && "border-blue-300 dark:border-blue-700")}>
        <CardContent className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">
                {dictionary.tracking.stages[stage.stageType as keyof typeof dictionary.tracking.stages]}
              </h3>
              <p className="text-sm text-muted-foreground">
                {dictionary.tracking.stageDescriptions[stage.stageType as keyof typeof dictionary.tracking.stageDescriptions]}
              </p>
            </div>
            <Badge className={cn("w-fit", styles.badge)}>
              {dictionary.tracking.statuses[stage.status as keyof typeof dictionary.tracking.statuses]}
            </Badge>
          </div>

          {/* Timestamps */}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {stage.completedAt && (
              <div>
                <span className="font-medium">{dictionary.tracking.completedAt}:</span>{" "}
                {formatTrackingDate(stage.completedAt, locale)}
              </div>
            )}
            {stage.startedAt && !stage.completedAt && (
              <div>
                <span className="font-medium">{dictionary.tracking.startedAt}:</span>{" "}
                {formatTrackingDate(stage.startedAt, locale)}
              </div>
            )}
            {stage.status === "PENDING" && stage.estimatedAt && (
              <div>
                <span className="font-medium">{dictionary.tracking.eta}:</span>{" "}
                {getRelativeTime(stage.estimatedAt, locale)}
              </div>
            )}
          </div>

          {/* Notes */}
          {stage.notes && (
            <div className="mt-3 rounded-md bg-muted p-2 text-sm">
              <span className="font-medium">{dictionary.tracking.notes}:</span> {stage.notes}
            </div>
          )}

          {/* Payment Section */}
          {canRequestPayment && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-3">
              {/* Payment Status Badges */}
              {stage.paymentReceived ? (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  <IconCheck className="me-1 h-3 w-3" />
                  {dictionary.tracking.paymentReceived}
                </Badge>
              ) : stage.paymentRequested ? (
                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                  <IconClock className="me-1 h-3 w-3" />
                  {dictionary.tracking.paymentRequested}
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRequestPayment?.(stage.id, stage.stageType)}
                  className="gap-1"
                >
                  <IconCash className="h-4 w-4" />
                  {dictionary.tracking.requestPayment}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
