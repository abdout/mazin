"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconSearch } from "@tabler/icons-react"
import type { Dictionary } from "@/components/internationalization/types"
import type { Locale } from "@/components/internationalization/config"

interface TrackingSearchFormProps {
  dictionary: Dictionary
  locale: Locale
}

export function TrackingSearchForm({ dictionary, locale }: TrackingSearchFormProps) {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber.trim()) return

    setIsLoading(true)
    router.push(`/${locale}/track/${trackingNumber.trim().toUpperCase()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <IconSearch className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={dictionary.tracking.enterNumber}
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          className="h-12 ps-10 text-base"
          dir="ltr"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="h-12 px-8"
        disabled={!trackingNumber.trim() || isLoading}
      >
        {isLoading ? dictionary.common.loading : dictionary.tracking.trackButton}
      </Button>
    </form>
  )
}
