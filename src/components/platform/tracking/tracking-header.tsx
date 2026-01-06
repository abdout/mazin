"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  IconCopy,
  IconCheck,
  IconShip,
  IconPackage,
  IconBox,
  IconCalendarTime,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { STATUS_STYLES, formatTrackingDate } from "@/lib/tracking"
import type { PublicTrackingData } from "@/lib/tracking"
import type { Dictionary } from "@/components/internationalization/types"

interface TrackingHeaderProps {
  data: PublicTrackingData
  dictionary: Dictionary
  locale: string
  className?: string
}

export function TrackingHeader({
  data,
  dictionary,
  locale,
  className,
}: TrackingHeaderProps) {
  const [copied, setCopied] = useState(false)

  const currentStageData = useMemo(
    () => data.stages.find((s) => s.stageType === data.currentStage),
    [data.stages, data.currentStage]
  )
  const currentStyles = currentStageData
    ? STATUS_STYLES[currentStageData.status]
    : STATUS_STYLES.PENDING

  const isComplete = data.progress.percentage === 100

  const copyTrackingLink = useCallback(async () => {
    try {
      const url = `${window.location.origin}/${locale}/track/${data.trackingNumber}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      console.error("Failed to copy to clipboard")
    }
  }, [locale, data.trackingNumber])

  const stageName =
    dictionary.tracking.stages[
      data.currentStage as keyof typeof dictionary.tracking.stages
    ]

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
              aria-hidden="true"
            >
              <IconPackage className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg font-mono tracking-wide" dir="ltr">
                {data.trackingNumber}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {dictionary.tracking.shipmentInfo}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyTrackingLink}
            className="w-fit shrink-0"
            aria-label={
              copied
                ? dictionary.tracking.linkCopied
                : dictionary.tracking.copyLink
            }
          >
            {copied ? (
              <>
                <IconCheck className="me-2 h-4 w-4 text-green-600" aria-hidden="true" />
                {dictionary.tracking.linkCopied}
              </>
            ) : (
              <>
                <IconCopy className="me-2 h-4 w-4" aria-hidden="true" />
                {dictionary.tracking.copyLink}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Grid */}
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Current Status */}
          <div className="space-y-1.5">
            <dt className="text-sm font-medium text-muted-foreground">
              {dictionary.tracking.currentStatus}
            </dt>
            <dd>
              <Badge className={cn("font-medium", currentStyles.badge)}>
                {stageName}
              </Badge>
            </dd>
          </div>

          {/* Vessel Name */}
          {data.vesselName && (
            <div className="space-y-1.5">
              <dt className="text-sm font-medium text-muted-foreground">
                {dictionary.tracking.vesselName}
              </dt>
              <dd className="flex items-center gap-2">
                <IconShip
                  className="h-4 w-4 text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                <span className="font-medium truncate">{data.vesselName}</span>
              </dd>
            </div>
          )}

          {/* Container Number */}
          {data.containerNumber && (
            <div className="space-y-1.5">
              <dt className="text-sm font-medium text-muted-foreground">
                {dictionary.tracking.containerNumber}
              </dt>
              <dd className="flex items-center gap-2">
                <IconBox
                  className="h-4 w-4 text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                <span className="font-medium font-mono" dir="ltr">
                  {data.containerNumber}
                </span>
              </dd>
            </div>
          )}

          {/* Estimated Delivery */}
          {data.estimatedDelivery && (
            <div className="space-y-1.5">
              <dt className="text-sm font-medium text-muted-foreground">
                {dictionary.tracking.estimatedDelivery}
              </dt>
              <dd className="flex items-center gap-2">
                <IconCalendarTime
                  className="h-4 w-4 text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                <time
                  className="font-medium"
                  dateTime={data.estimatedDelivery.toISOString()}
                  dir="ltr"
                >
                  {formatTrackingDate(data.estimatedDelivery, locale)}
                </time>
              </dd>
            </div>
          )}
        </dl>

        {/* Progress */}
        <div className="pt-4 border-t border-border/50">
          <div
            className="flex items-center justify-between text-sm mb-2"
            role="progressbar"
            aria-valuenow={data.progress.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${dictionary.tracking.progress}: ${data.progress.percentage}%`}
          >
            <span className="font-medium text-foreground">
              {dictionary.tracking.progress}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {data.progress.completed} / {data.progress.total} (
              {data.progress.percentage}%)
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full transition-all duration-500 ease-out",
                isComplete ? "bg-green-500 dark:bg-green-600" : "bg-primary"
              )}
              style={{ width: `${data.progress.percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
