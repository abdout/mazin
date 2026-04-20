// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { Dictionary } from "@/components/internationalization/types"
import type {
  NotificationChannel,
  NotificationType,
} from "@prisma/client"

import { updateNotificationPreferences } from "./actions"
import {
  CHANNEL_CONFIG,
  CHANNEL_ICONS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_CONFIG,
  TYPE_DICT_KEY,
} from "./config"
import type { NotificationPreferenceDTO, PreferenceMatrix } from "./types"

type Locale = "ar" | "en"

interface PreferencesFormProps {
  initial: NotificationPreferenceDTO
  dictionary: Dictionary
  locale: Locale
}

export function NotificationPreferencesForm({
  initial,
  dictionary,
  locale,
}: PreferencesFormProps) {
  const [matrix, setMatrix] = React.useState<PreferenceMatrix>(() =>
    normalizeMatrix(initial.preferences)
  )
  const [quietStart, setQuietStart] = React.useState<number>(
    initial.quietHoursStart ?? 22
  )
  const [quietEnd, setQuietEnd] = React.useState<number>(initial.quietHoursEnd ?? 8)
  const [quietEnabled, setQuietEnabled] = React.useState<boolean>(
    initial.quietHoursStart !== null && initial.quietHoursEnd !== null
  )
  const [whatsappNumber, setWhatsappNumber] = React.useState<string>(
    initial.whatsappNumber ?? ""
  )
  const [saving, startTransition] = React.useTransition()

  const dict = (dictionary as unknown as { notifications?: Record<string, unknown> })
    .notifications as Record<string, unknown> | undefined
  const typesDict = (dict?.types ?? {}) as Record<string, string>
  const channelsDict = (dict?.channels ?? {}) as Record<string, string>
  const page = (dict?.page ?? {}) as Record<string, string>

  const toggleChannel = React.useCallback(
    (type: NotificationType, channel: NotificationChannel) => {
      setMatrix((prev) => {
        const current = new Set(prev[type] ?? [])
        if (current.has(channel)) {
          current.delete(channel)
        } else {
          current.add(channel)
        }
        return { ...prev, [type]: Array.from(current) as NotificationChannel[] }
      })
    },
    []
  )

  const onSave = React.useCallback(() => {
    startTransition(async () => {
      const res = await updateNotificationPreferences({
        preferences: matrix,
        quietHoursStart: quietEnabled ? quietStart : null,
        quietHoursEnd: quietEnabled ? quietEnd : null,
        whatsappNumber: whatsappNumber.trim() || null,
      })
      if (res.ok) {
        toast.success(
          (dict?.messages as Record<string, string> | undefined)?.saved ??
            dictionary.common.success
        )
      } else {
        toast.error(
          (dict?.messages as Record<string, string> | undefined)?.failed ??
            dictionary.common.error
        )
      }
    })
  }, [
    dict?.messages,
    dictionary.common.error,
    dictionary.common.success,
    matrix,
    quietEnabled,
    quietEnd,
    quietStart,
    whatsappNumber,
  ])

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {page.matrixTitle ??
              (locale === "ar" ? "قنوات الإشعار" : "Notification channels")}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-2 ps-0 text-start font-medium">
                  {page.typeColumn ?? (locale === "ar" ? "النوع" : "Type")}
                </th>
                {NOTIFICATION_CHANNELS.map((channel) => {
                  const Icon = CHANNEL_ICONS[channel]
                  const label = channelsDict[channel] ?? channel
                  return (
                    <th
                      key={channel}
                      className={cn(
                        "py-2 text-center font-medium",
                        !CHANNEL_CONFIG[channel].enabled && "opacity-40"
                      )}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Icon className="size-4" aria-hidden />
                        <span className="text-xs">{label}</span>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_TYPES.map((type) => {
                const typeCfg = NOTIFICATION_TYPE_CONFIG[type]
                const TypeIcon = typeCfg?.icon
                const typeLabel = typesDict[TYPE_DICT_KEY[type]] ?? type
                const selected = new Set(matrix[type] ?? [])
                return (
                  <tr key={type} className="border-t">
                    <td className="py-2 ps-0">
                      <div className="flex items-center gap-2">
                        {TypeIcon && (
                          <TypeIcon
                            className="size-4 text-muted-foreground"
                            aria-hidden
                          />
                        )}
                        <span>{typeLabel}</span>
                      </div>
                    </td>
                    {NOTIFICATION_CHANNELS.map((channel) => {
                      const isEnabled = CHANNEL_CONFIG[channel].enabled
                      return (
                        <td key={channel} className="py-2 text-center">
                          <div className="flex justify-center">
                            <Switch
                              aria-label={`${typeLabel} • ${channelsDict[channel] ?? channel}`}
                              checked={selected.has(channel)}
                              disabled={!isEnabled}
                              onCheckedChange={() => toggleChannel(type, channel)}
                            />
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {page.quietHoursTitle ??
              (locale === "ar" ? "ساعات الصمت" : "Quiet hours")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet-toggle" className="text-sm">
              {page.quietHoursToggle ??
                (locale === "ar"
                  ? "تفعيل ساعات الصمت"
                  : "Enable quiet hours")}
            </Label>
            <Switch
              id="quiet-toggle"
              checked={quietEnabled}
              onCheckedChange={setQuietEnabled}
            />
          </div>

          <div className={cn("grid gap-4 sm:grid-cols-2", !quietEnabled && "opacity-50")}>
            <div className="flex flex-col gap-2">
              <Label className="text-sm">
                {page.quietHoursStart ??
                  (locale === "ar" ? "بداية" : "Start")}
                {": "}
                <span className="font-medium">
                  {formatHour(quietStart)}
                </span>
              </Label>
              <Slider
                value={[quietStart]}
                min={0}
                max={23}
                step={1}
                onValueChange={(v) => setQuietStart(v[0] ?? 22)}
                disabled={!quietEnabled}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm">
                {page.quietHoursEnd ??
                  (locale === "ar" ? "نهاية" : "End")}
                {": "}
                <span className="font-medium">
                  {formatHour(quietEnd)}
                </span>
              </Label>
              <Slider
                value={[quietEnd]}
                min={0}
                max={23}
                step={1}
                onValueChange={(v) => setQuietEnd(v[0] ?? 8)}
                disabled={!quietEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {page.whatsappTitle ?? (locale === "ar" ? "واتساب" : "WhatsApp")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Label htmlFor="whatsapp" className="text-sm">
            {page.whatsappNumber ??
              (locale === "ar"
                ? "رقم واتساب"
                : "WhatsApp number")}
          </Label>
          <Input
            id="whatsapp"
            dir="ltr"
            placeholder="+249..."
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {page.whatsappHelp ??
              (locale === "ar"
                ? "يستخدم لإرسال إشعارات واتساب عند تفعيلها أعلاه."
                : "Used when WhatsApp is enabled above.")}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button disabled={saving} onClick={onSave}>
          {saving ? dictionary.common.loading : dictionary.common.save}
        </Button>
      </div>
    </div>
  )
}

function normalizeMatrix(raw: PreferenceMatrix): PreferenceMatrix {
  const out: PreferenceMatrix = {}
  for (const type of NOTIFICATION_TYPES) {
    out[type] = (raw[type] ?? ["IN_APP"]) as NotificationChannel[]
  }
  return out
}

function formatHour(h: number): string {
  const hh = String(Math.max(0, Math.min(23, h))).padStart(2, "0")
  return `${hh}:00`
}
