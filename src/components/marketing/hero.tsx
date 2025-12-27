'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Dictionary } from '@/components/internationalization/types'
import { useLocale } from '@/components/internationalization'
import { useLoading } from './loading-context'

interface HeroProps {
  dictionary: Dictionary
}

// Animation variants for staggered text reveal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
}

const wordVariants = {
  hidden: {
    opacity: 0,
    y: 40,
    rotateX: -90,
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: 'spring' as const,
      damping: 12,
      stiffness: 100,
    },
  },
}

// Component to animate each word in a line
function AnimatedWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(' ')

  return (
    <motion.span className={className} style={{ display: 'block', perspective: '1000px' }}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={wordVariants}
          style={{
            display: 'inline-block',
            marginInlineEnd: '0.25em',
            transformStyle: 'preserve-3d',
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  )
}

export function Hero({ dictionary }: HeroProps) {
  const { hero } = dictionary.marketing
  const { locale } = useLocale()
  const router = useRouter()
  const [trackingNumber, setTrackingNumber] = useState('')
  const isArabic = locale === 'ar'
  const { setVideoLoaded } = useLoading()
  const videoRef = useRef<HTMLVideoElement>(null)

  // Check if video is already loaded (e.g., from cache on refresh)
  useEffect(() => {
    const video = videoRef.current
    if (video && video.readyState >= 3) {
      setVideoLoaded()
    }
  }, [setVideoLoaded])

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
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={setVideoLoaded}
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

          {/* Title - mobile lines vary by locale, 2 lines on desktop */}
          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-4 sm:mb-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Mobile */}
            <span className="sm:hidden">
              <AnimatedWords text={hero.titleMobileLine1} />
              <AnimatedWords text={hero.titleMobileLine2} />
              {hero.titleMobileLine3 && <AnimatedWords text={hero.titleMobileLine3} />}
            </span>
            {/* Desktop: 2 lines */}
            <span className="hidden sm:block">
              <AnimatedWords text={hero.titleLine1} />
              <AnimatedWords text={hero.titleLine2} className="whitespace-nowrap" />
            </span>
          </motion.h1>

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
