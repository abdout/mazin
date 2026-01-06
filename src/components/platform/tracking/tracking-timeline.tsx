"use client"

import { useMemo } from "react"
import { STAGE_CONFIG, getProgress } from "@/lib/tracking"
import { TrackingStageItem } from "./tracking-stage-item"
import { cn } from "@/lib/utils"
import type { TrackingStage, TrackingStageType } from "@prisma/client"
import type { Dictionary } from "@/components/internationalization/types"

interface TrackingTimelineProps {
  stages: TrackingStage[]
  dictionary: Dictionary
  locale: string
  showPaymentControls?: boolean
  onRequestPayment?: (stageId: string, stageType: TrackingStageType) => void
  className?: string
  compact?: boolean
}

export function TrackingTimeline({
  stages,
  dictionary,
  locale,
  showPaymentControls = false,
  onRequestPayment,
  className,
  compact = false,
}: TrackingTimelineProps) {
  // Memoize sorted stages
  const sortedStages = useMemo(
    () =>
      [...stages].sort(
        (a, b) => STAGE_CONFIG[a.stageType].order - STAGE_CONFIG[b.stageType].order
      ),
    [stages]
  )

  const progress = useMemo(() => getProgress(stages), [stages])

  const isComplete = progress.percentage === 100

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress bar */}
      <div
        className="space-y-2"
        role="progressbar"
        aria-valuenow={progress.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${dictionary.tracking.progress}: ${progress.percentage}%`}
      >
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {dictionary.tracking.progress}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {progress.completed} / {progress.total} ({progress.percentage}%)
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out",
              isComplete
                ? "bg-green-500 dark:bg-green-600"
                : "bg-primary"
            )}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <ol
        className="relative"
        role="list"
        aria-label={dictionary.tracking.title}
      >
        {sortedStages.map((stage, index) => (
          <li key={stage.id}>
            <TrackingStageItem
              stage={stage}
              isLast={index === sortedStages.length - 1}
              isFirst={index === 0}
              stageNumber={index + 1}
              totalStages={sortedStages.length}
              dictionary={dictionary}
              locale={locale}
              showPaymentControls={showPaymentControls}
              onRequestPayment={onRequestPayment}
              compact={compact}
            />
          </li>
        ))}
      </ol>
    </div>
  )
}
