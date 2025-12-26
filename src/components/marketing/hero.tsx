'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dictionary } from '@/components/internationalization/types'
import { useLocale } from '@/components/internationalization'

interface HeroProps {
  dictionary: Dictionary
}

export function Hero({ dictionary }: HeroProps) {
  const { hero } = dictionary.marketing
  const { locale } = useLocale()
  const router = useRouter()
  const [trackingNumber, setTrackingNumber] = useState('')
  const isArabic = locale === 'ar'

  const handleTrack = () => {
    if (trackingNumber.trim()) {
      router.push(`/${locale}/track/${trackingNumber.trim()}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTrack()
    }
  }

  return (
    <section className="relative h-screen">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center" style={{ paddingInline: 'var(--container-padding)' }}>
        <div className={`max-w-lg ${isArabic ? 'bg-black/30 backdrop-blur-md border border-white/30 rounded-2xl p-5 sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 sm:rounded-none' : ''}`}>
          {/* Badge */}
          <span className="inline-block text-xs font-semibold tracking-wider text-white/80 uppercase mb-4">
            {hero.badge}
          </span>

          {/* Title - 3 lines on mobile, 2 lines on desktop */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-4 sm:mb-6">
            {/* Mobile: 3 lines */}
            <span className="block sm:hidden">{hero.titleMobileLine1}</span>
            <span className="block sm:hidden">{hero.titleMobileLine2}</span>
            <span className="block sm:hidden">{hero.titleMobileLine3}</span>
            {/* Desktop: 2 lines */}
            <span className="hidden sm:block">{hero.titleLine1}</span>
            <span className="hidden sm:block whitespace-nowrap">{hero.titleLine2}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed">
            {hero.subtitle}
          </p>

          {/* Track Input with Button */}
          <div className="relative inline-flex items-center w-[70%] sm:w-auto">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hero.trackPlaceholder}
              className="h-11 sm:h-12 w-full sm:w-80 ps-4 sm:ps-5 pe-24 sm:pe-28 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm sm:text-base"
            />
            <Button
              size="sm"
              onClick={handleTrack}
              className="absolute end-1.5 bg-blue-500 hover:bg-blue-600 text-white font-medium h-8 sm:h-9 px-3 sm:px-5 gap-1 sm:gap-1.5 rounded-full text-xs sm:text-sm"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{hero.trackButton}</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
