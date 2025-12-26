'use client'

import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Dictionary } from '@/components/internationalization/types'

interface AllInOneProps {
  dictionary: Dictionary
}

export function AllInOne({ dictionary }: AllInOneProps) {
  const { allInOne } = dictionary.marketing

  // Anthropic design colors: terracotta, blue, lavender, sage
  const cards = [
    {
      id: 0,
      bgColor: 'bg-[#D97757]',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop',
      icon: '/settings.png',
      tags: [allInOne.tags.control, allInOne.tags.ops],
      description: allInOne.features.documentation.description,
    },
    {
      id: 1,
      bgColor: 'bg-[#CBCADB]',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop',
      icon: '/money.png',
      tags: [allInOne.tags.cost, allInOne.tags.efficiency],
      description: allInOne.features.invoicing.description,
    },
    {
      id: 2,
      bgColor: 'bg-[#BCD1CA]',
      image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=2070&auto=format&fit=crop',
      icon: '/approval.png',
      tags: [allInOne.tags.speed, allInOne.tags.accuracy],
      description: allInOne.features.access.description,
    },
  ]

  return (
    <section id="features" className="py-12 sm:py-16 md:py-20 bg-muted">
      <div style={{ paddingInline: 'var(--container-padding)' }}>
        {/* Split Header */}
        <div className="grid lg:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-12">
          {/* Left: Badge + Title */}
          <div>
            <span className="inline-block text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3 md:mb-4 px-3 md:px-4 py-1.5 md:py-2 border border-border rounded-full">
              {allInOne.badge}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              {allInOne.title}
            </h2>
          </div>

          {/* Right: Subtitle */}
          <div className="flex items-end">
            <p className="text-base md:text-lg text-muted-foreground">
              {allInOne.subtitle}
            </p>
          </div>
        </div>

        {/* Interactive Cards */}
        <div className="flex flex-col md:flex-row gap-4 md:h-[320px]">
          {cards.map((card) => (
            <FeatureCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface CardData {
  id: number
  bgColor: string
  image: string
  icon: string
  tags: string[]
  description: string
}

function FeatureCard({ card }: { card: CardData }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className={`relative rounded-2xl overflow-hidden cursor-pointer ${card.bgColor} h-[280px] md:h-auto`}
      initial={{ flex: 1 }}
      animate={{ flex: isHovered ? 2 : 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        <Image
          src={card.image}
          alt="Feature background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      </motion.div>

      {/* Default State - Column layout on mobile */}
      <motion.div
        className="absolute inset-0 flex flex-col p-4 md:p-5"
        initial={{ opacity: 1 }}
        animate={{ opacity: isHovered ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Arrow link - top right */}
        <div className="flex justify-end mb-2 md:mb-0">
          <motion.div
            className="px-3 md:px-4 py-1.5 md:py-2 rounded-full flex items-center justify-center cursor-pointer backdrop-blur-md border"
            initial={{
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              borderColor: 'rgba(0, 0, 0, 0.2)'
            }}
            animate={{
              backgroundColor: isHovered ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.1)',
              borderColor: isHovered ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.2)',
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{ color: isHovered ? '#ffffff' : '#374151' }}
              transition={{ duration: 0.3 }}
            >
              <ArrowUpRight className="w-4 h-4" />
            </motion.div>
          </motion.div>
        </div>

        {/* Icon */}
        <motion.div
          className="flex-1 flex items-start"
          animate={{ scale: isHovered ? 0.9 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={card.icon}
            alt=""
            width={100}
            height={100}
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain"
          />
        </motion.div>

        {/* Tags and Description */}
        <div className="mt-auto">
          <div className="flex flex-wrap gap-2 mb-2">
            {card.tags.map((tag) => (
              <span key={tag} className="px-2 md:px-3 py-1 bg-background/80 dark:bg-background/50 text-foreground text-xs md:text-sm font-medium rounded-full border border-border/50">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-foreground text-xs md:text-sm leading-relaxed line-clamp-2">
            {card.description}
          </p>
        </div>
      </motion.div>

      {/* Hover State */}
      <motion.div
        className="absolute inset-x-0 bottom-0 p-4 md:p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 20,
        }}
        transition={{ duration: 0.4, delay: isHovered ? 0.1 : 0 }}
      >
        <motion.div
          className="mb-3"
          initial={{ scale: 0.8 }}
          animate={{ scale: isHovered ? 1 : 0.8 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Image
            src={card.icon}
            alt=""
            width={40}
            height={40}
            className="w-8 h-8 md:w-10 md:h-10 object-contain brightness-0 invert"
          />
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-2">
          {card.tags.map((tag, index) => (
            <motion.span
              key={tag}
              className="px-2 md:px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs md:text-sm font-medium rounded-full"
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                x: isHovered ? 0 : -10,
              }}
              transition={{ duration: 0.3, delay: isHovered ? 0.15 + index * 0.05 : 0 }}
            >
              {tag}
            </motion.span>
          ))}
        </div>

        <motion.p
          className="text-white/90 text-xs md:text-sm leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3, delay: isHovered ? 0.2 : 0 }}
        >
          {card.description}
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
