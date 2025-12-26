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

  // Anthropic website actual colors
  const cards = [
    {
      id: 0,
      bgColor: 'bg-[#e8e6dc] dark:bg-[#2a2826]',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop',
      icon: '/settings.png',
      tags: [allInOne.tags.control, allInOne.tags.ops],
      description: allInOne.features.documentation.description,
    },
    {
      id: 1,
      bgColor: 'bg-[#f0eee6] dark:bg-[#252423]',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop',
      icon: '/money.png',
      tags: [allInOne.tags.cost, allInOne.tags.efficiency],
      description: allInOne.features.invoicing.description,
    },
    {
      id: 2,
      bgColor: 'bg-[#e8e6dc] dark:bg-[#2a2826]',
      image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=2070&auto=format&fit=crop',
      icon: '/approval.png',
      tags: [allInOne.tags.speed, allInOne.tags.accuracy],
      description: allInOne.features.access.description,
    },
  ]

  return (
    <section id="features" className="py-20 bg-muted">
      <div style={{ paddingInline: 'var(--container-padding)' }}>
        {/* Split Header */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Left: Badge + Title */}
          <div>
            <span className="inline-block text-xs font-medium tracking-wider text-muted-foreground uppercase mb-4 px-4 py-2 border border-border rounded-full">
              {allInOne.badge}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              {allInOne.title}
            </h2>
          </div>

          {/* Right: Subtitle */}
          <div className="flex items-end">
            <p className="text-lg text-muted-foreground">
              {allInOne.subtitle}
            </p>
          </div>
        </div>

        {/* Interactive Cards */}
        <div className="flex gap-4 h-[320px]">
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
      className={`relative rounded-2xl overflow-hidden cursor-pointer ${card.bgColor}`}
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

      {/* Arrow link */}
      <div className="absolute top-4 end-4 z-10">
        <motion.div
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          initial={{ backgroundColor: 'rgba(156, 163, 175, 0.1)' }}
          animate={{
            backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(156, 163, 175, 0.1)',
          }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            animate={{ color: isHovered ? '#ffffff' : '#6b7280' }}
            transition={{ duration: 0.3 }}
          >
            <ArrowUpRight className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </div>

      {/* Default State */}
      <motion.div
        className="absolute inset-0 flex flex-col items-start justify-between p-5"
        initial={{ opacity: 1 }}
        animate={{ opacity: isHovered ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="pt-1"
          animate={{ scale: isHovered ? 0.9 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={card.icon}
            alt=""
            width={100}
            height={100}
            className="w-24 h-24 object-contain"
          />
        </motion.div>

        <div>
          <div className="flex gap-2 mb-2">
            {card.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-background/80 dark:bg-background/50 text-foreground text-sm font-medium rounded-full border border-border/50">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-foreground text-sm leading-relaxed line-clamp-2">
            {card.description}
          </p>
        </div>
      </motion.div>

      {/* Hover State */}
      <motion.div
        className="absolute inset-x-0 bottom-0 p-5"
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
            className="w-10 h-10 object-contain brightness-0 invert"
          />
        </motion.div>

        <div className="flex gap-2 mb-2">
          {card.tags.map((tag, index) => (
            <motion.span
              key={tag}
              className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full"
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
          className="text-white/90 text-sm leading-relaxed"
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
