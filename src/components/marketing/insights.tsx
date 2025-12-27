'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Dictionary } from '@/components/internationalization/types'
import '@/styles/animation-box.css'

// Static featured articles data
const FEATURED_ARTICLES = [
  { slug: 'sudan-customs-digital-system', image: '/digital.jpg' },
  { slug: 'red-sea-shipping-crisis', image: '/red-sea.jpg' },
  { slug: 'port-sudan-operations-update', image: '/operation.jpg' },
]

interface InsightsProps {
  dictionary: Dictionary
}

// Custom easing curve
const smoothEase = [0.22, 1, 0.36, 1] as const

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const headerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: smoothEase,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: smoothEase,
    },
  },
}


const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: smoothEase,
    },
  },
}

export function Insights({ dictionary }: InsightsProps) {
  const { insights } = dictionary.marketing
  const featuredArticles = FEATURED_ARTICLES

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-background overflow-hidden">
      <div style={{ paddingInline: 'var(--container-padding)' }}>
        {/* Section Header */}
        <motion.div
          className="mb-8 sm:mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {/* Badge */}
          <motion.span
            className="inline-block text-sm font-medium text-foreground border border-border rounded-full px-4 py-1 mb-6"
            variants={badgeVariants}
          >
            {insights.badge}
          </motion.span>

          {/* Title */}
          <motion.h2
            className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-foreground leading-tight"
            variants={headerVariants}
          >
            {insights.title}
          </motion.h2>
        </motion.div>

        {/* Articles Grid */}
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
        >
          {featuredArticles.map((article, index) => {
            const articleContent = insights.articles[article.slug as keyof typeof insights.articles]
            if (!articleContent) return null

            return (
              <motion.article
                key={article.slug}
                className="group"
                variants={cardVariants}
                initial="rest"
                whileHover="hover"
                custom={index}
              >
                {/* Card Container */}
                <motion.div
                  className="rounded-md overflow-hidden border border-border cursor-pointer"
                  whileHover={{
                    y: -8,
                    boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.15)",
                    transition: { duration: 0.3, ease: smoothEase },
                  }}
                >
                  {/* Image Container with slow zoom animation */}
                  <div className="relative aspect-[4/3] animation-box">
                    <div className="absolute inset-0">
                      <Image
                        src={article.image}
                        alt={articleContent.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {/* Date Badge */}
                    <motion.div
                      className="absolute top-3 end-3 sm:top-4 sm:end-4"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                    >
                      <span className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-black/30 backdrop-blur-md border border-white/50 rounded-full text-xs sm:text-sm font-medium text-white whitespace-nowrap">
                        {articleContent.date}
                      </span>
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3 bg-card">
                    {/* Category Badge */}
                    <motion.span
                      className="inline-block text-sm text-muted-foreground border border-border rounded-full px-4 py-1"
                      whileHover={{
                        backgroundColor: "hsl(var(--primary) / 0.1)",
                        borderColor: "hsl(var(--primary) / 0.3)",
                        transition: { duration: 0.2 },
                      }}
                    >
                      {articleContent.category}
                    </motion.span>

                    {/* Title */}
                    <motion.h3
                      className="text-foreground text-lg font-semibold"
                      whileHover={{
                        color: "hsl(var(--primary))",
                        transition: { duration: 0.2 },
                      }}
                    >
                      {articleContent.title}
                    </motion.h3>

                    {/* Description */}
                    <p className="text-muted-foreground text-base leading-relaxed line-clamp-2">
                      {articleContent.description}
                    </p>
                  </div>
                </motion.div>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
