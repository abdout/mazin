"use client"

import { memo, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconCash, IconCheck, IconClock } from "@tabler/icons-react"
import { STAGE_ICONS, STATUS_STYLES, isPayableStage } from "@/lib/tracking"
import type { TrackingStage, TrackingStageType } from "@prisma/client"
import type { Dictionary } from "@/components/internationalization/types"
import { formatTrackingDate, getRelativeTime } from "@/lib/tracking"

interface TrackingStageItemProps {
  stage: TrackingStage
  isLast: boolean
  isFirst?: boolean
  stageNumber?: number
  totalStages?: number
  dictionary: Dictionary
  locale: string
  showPaymentControls?: boolean
  onRequestPayment?: (stageId: string, stageType: TrackingStageType) => void
  compact?: boolean
}

function TrackingStageItemComponent({
  stage,
  isLast,
  isFirst = false,
  stageNumber,
  totalStages,
  dictionary,
  locale,
  showPaymentControls = false,
  onRequestPayment,
  compact = false,
}: TrackingStageItemProps) {
  const Icon = STAGE_ICONS[stage.stageType]
  const styles = STATUS_STYLES[stage.status]
  const isActive = stage.status === "IN_PROGRESS"
  const isCompleted = stage.status === "COMPLETED"
  const isSkipped = stage.status === "SKIPPED"
  const canRequestPayment = isPayableStage(stage.stageType) && showPaymentControls

  const stageName = dictionary.tracking.stages[stage.stageType as keyof typeof dictionary.tracking.stages]
  const stageDescription = dictionary.tracking.stageDescriptions[stage.stageType as keyof typeof dictionary.tracking.stageDescriptions]
  const statusLabel = dictionary.tracking.statuses[stage.status as keyof typeof dictionary.tracking.statuses]

  // Memoize formatted dates
  const formattedDates = useMemo(() => ({
    completed: stage.completedAt ? formatTrackingDate(stage.completedAt, locale) : null,
    started: stage.startedAt ? formatTrackingDate(stage.startedAt, locale) : null,
    eta: stage.estimatedAt ? getRelativeTime(stage.estimatedAt, locale) : null,
  }), [stage.completedAt, stage.startedAt, stage.estimatedAt, locale])

  return (
    <article
      className={cn(
        "relative flex gap-4 pb-8 last:pb-0",
        compact && "pb-4"
      )}
      aria-label={`${stageName} - ${statusLabel}`}
      aria-current={isActive ? "step" : undefined}
    >
      {/* Vertical connector line - RTL aware with start positioning */}
      {!isLast && (
        <div
          className={cn(
            "absolute start-6 top-12 w-0.5",
            compact ? "h-[calc(100%-2rem)]" : "h-[calc(100%-3rem)]",
            isCompleted || isSkipped
              ? "bg-green-300 dark:bg-green-700"
              : "bg-muted-foreground/20"
          )}
          aria-hidden="true"
        />
      )}

      {/* Icon circle */}
      <div
        className={cn(
          "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
          styles.bg,
          styles.text,
          styles.border,
          isActive && "ring-4 ring-primary/20 animate-pulse"
        )}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content card */}
      <Card
        className={cn(
          "flex-1 transition-all duration-200",
          isActive && "border-primary/50 shadow-sm",
          isCompleted && "border-green-200 dark:border-green-800/50"
        )}
      >
        <CardContent className={cn("p-4", compact && "p-3")}>
          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">
                  {stageName}
                </h3>
                {stageNumber && totalStages && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    ({stageNumber}/{totalStages})
                  </span>
                )}
              </div>
              {!compact && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {stageDescription}
                </p>
              )}
            </div>
            <Badge
              className={cn("shrink-0 w-fit", styles.badge)}
              aria-label={`${dictionary.tracking.currentStatus}: ${statusLabel}`}
            >
              {statusLabel}
            </Badge>
          </div>

          {/* Timestamps - RTL aware with start/end */}
          {!compact && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {formattedDates.completed && (
                <div className="flex items-center gap-1.5">
                  <IconCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" aria-hidden="true" />
                  <span className="font-medium">{dictionary.tracking.completedAt}:</span>
                  <time dateTime={stage.completedAt?.toISOString()} dir="ltr">
                    {formattedDates.completed}
                  </time>
                </div>
              )}
              {formattedDates.started && !formattedDates.completed && (
                <div className="flex items-center gap-1.5">
                  <IconClock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span className="font-medium">{dictionary.tracking.startedAt}:</span>
                  <time dateTime={stage.startedAt?.toISOString()} dir="ltr">
                    {formattedDates.started}
                  </time>
                </div>
              )}
              {stage.status === "PENDING" && formattedDates.eta && (
                <div className="flex items-center gap-1.5">
                  <IconClock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium">{dictionary.tracking.eta}:</span>
                  <span>{formattedDates.eta}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {stage.notes && !compact && (
            <div className="mt-3 rounded-md bg-muted/50 p-2.5 text-sm">
              <span className="font-medium text-foreground">{dictionary.tracking.notes}:</span>{" "}
              <span className="text-muted-foreground">{stage.notes}</span>
            </div>
          )}

          {/* Payment Section */}
          {canRequestPayment && !compact && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/50 pt-3">
              {stage.paymentReceived ? (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                  <IconCheck className="me-1.5 h-3 w-3" aria-hidden="true" />
                  {dictionary.tracking.paymentReceived}
                </Badge>
              ) : stage.paymentRequested ? (
                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
                  <IconClock className="me-1.5 h-3 w-3" aria-hidden="true" />
                  {dictionary.tracking.paymentRequested}
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRequestPayment?.(stage.id, stage.stageType)}
                  className="gap-1.5"
                >
                  <IconCash className="h-4 w-4" aria-hidden="true" />
                  {dictionary.tracking.requestPayment}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </article>
  )
}

// Memoize for performance - stages don't change frequently
export const TrackingStageItem = memo(TrackingStageItemComponent)
