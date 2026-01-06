"use client"

import { useState, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconSearch, IconLoader2 } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { Dictionary } from "@/components/internationalization/types"
import type { Locale } from "@/components/internationalization/config"

interface TrackingSearchFormProps {
  dictionary: Dictionary
  locale: Locale
  className?: string
  autoFocus?: boolean
}

export function TrackingSearchForm({
  dictionary,
  locale,
  className,
  autoFocus = false,
}: TrackingSearchFormProps) {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isValidFormat = trackingNumber.trim().length >= 3

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!isValidFormat) return

      const normalizedNumber = trackingNumber.trim().toUpperCase()
      startTransition(() => {
        router.push(`/${locale}/track/${normalizedNumber}`)
      })
    },
    [trackingNumber, isValidFormat, locale, router]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow alphanumeric and hyphens only
      const value = e.target.value.replace(/[^a-zA-Z0-9-]/g, "")
      setTrackingNumber(value)
    },
    []
  )

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-3 sm:flex-row", className)}
      role="search"
      aria-label={dictionary.tracking.title}
    >
      <div className="relative flex-1">
        <IconSearch
          className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          type="text"
          placeholder={dictionary.tracking.enterNumber}
          value={trackingNumber}
          onChange={handleInputChange}
          className="h-12 ps-10 pe-4 text-base font-mono uppercase tracking-wide"
          dir="ltr"
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={20}
          aria-label={dictionary.tracking.trackingNumber}
          aria-describedby="tracking-hint"
        />
        <span id="tracking-hint" className="sr-only">
          {dictionary.tracking.enterNumber}
        </span>
      </div>
      <Button
        type="submit"
        size="lg"
        className="h-12 px-8 min-w-[120px]"
        disabled={!isValidFormat || isPending}
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <IconLoader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{dictionary.common.loading}</span>
          </>
        ) : (
          <>
            <IconSearch className="me-2 h-4 w-4 sm:hidden" aria-hidden="true" />
            <span>{dictionary.tracking.trackButton}</span>
          </>
        )}
      </Button>
    </form>
  )
}
