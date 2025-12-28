"use client"

import { STAGE_ORDER, STAGE_CONFIG, getProgress } from "@/lib/tracking"
import { TrackingStageItem } from "./tracking-stage-item"
import type { TrackingStage, TrackingStageType } from "@prisma/client"
import type { Dictionary } from "@/components/internationalization/types"

interface TrackingTimelineProps {
  stages: TrackingStage[]
  dictionary: Dictionary
  locale: string
  showPaymentControls?: boolean
  onRequestPayment?: (stageId: string, stageType: TrackingStageType) => void
}

export function TrackingTimeline({
  stages,
  dictionary,
  locale,
  showPaymentControls = false,
  onRequestPayment,
}: TrackingTimelineProps) {
  // Sort stages by order
  const sortedStages = [...stages].sort(
    (a, b) => STAGE_CONFIG[a.stageType].order - STAGE_CONFIG[b.stageType].order
  )

  const progress = getProgress(stages)

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{dictionary.tracking.progress}</span>
          <span className="text-muted-foreground">
            {progress.completed} / {progress.total} ({progress.percentage}%)
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {sortedStages.map((stage, index) => (
          <TrackingStageItem
            key={stage.id}
            stage={stage}
            isLast={index === sortedStages.length - 1}
            dictionary={dictionary}
            locale={locale}
            showPaymentControls={showPaymentControls}
            onRequestPayment={onRequestPayment}
          />
        ))}
      </div>
    </div>
  )
}
