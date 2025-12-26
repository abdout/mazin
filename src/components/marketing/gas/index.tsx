'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import type { Dictionary } from '@/components/internationalization/types'

// Dynamic import to avoid SSR issues with Three.js
const Container3D = dynamic(
  () => import('./container-3d').then((mod) => mod.Container3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    ),
  }
)

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] as const },
  },
}

interface GasSectionProps {
  dictionary: Dictionary
}

export function GasSection({ dictionary }: GasSectionProps) {
  const content = dictionary.marketing.gas

  const features = [
    {
      title: content.features.global.title,
      description: content.features.global.description,
      icon: '🌍',
    },
    {
      title: content.features.smart.title,
      description: content.features.smart.description,
      icon: '📦',
    },
    {
      title: content.features.fast.title,
      description: content.features.fast.description,
      icon: '⚡',
    },
  ]

  return (
    <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-background via-background/95 to-background">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content Side */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="order-2 lg:order-1"
          >
            <motion.span
              variants={itemVariants}
              className="inline-block px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-full mb-6"
            >
              {content.subtitle}
            </motion.span>

            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            >
              <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                {content.title}
              </span>
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl"
            >
              {content.description}
            </motion.p>

            {/* Features Grid */}
            <motion.div
              variants={containerVariants}
              className="grid sm:grid-cols-3 gap-6"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="group p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card/80 hover:border-primary/30 transition-all duration-300"
                >
                  <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </span>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div variants={itemVariants} className="mt-10">
              <button className="group relative px-8 py-4 bg-primary text-primary-foreground rounded-xl font-medium overflow-hidden transition-all hover:shadow-xl hover:shadow-primary/25">
                <span className="relative z-10">{content.cta}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </motion.div>
          </motion.div>

          {/* 3D Container Side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
            className="order-1 lg:order-2 h-[400px] md:h-[500px] lg:h-[600px] relative"
          >
            {/* Glow behind container */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            </div>

            <Container3D
              color="#FF6B35"
              secondaryColor="#1a1a2e"
              showParticles={true}
              showGround={true}
            />

            {/* Floating stats badges */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute top-10 left-4 md:left-0 px-4 py-2 bg-card/80 backdrop-blur-md rounded-xl border border-border/50 shadow-lg"
            >
              <div className="text-2xl font-bold text-primary">{content.stats.containers}</div>
              <div className="text-xs text-muted-foreground">{content.stats.containersLabel}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute bottom-20 right-4 md:right-0 px-4 py-2 bg-card/80 backdrop-blur-md rounded-xl border border-border/50 shadow-lg"
            >
              <div className="text-2xl font-bold text-green-500">{content.stats.delivery}</div>
              <div className="text-xs text-muted-foreground">{content.stats.deliveryLabel}</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
