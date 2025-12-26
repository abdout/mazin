'use client'

import Image from 'next/image'
import { Dictionary } from '@/components/internationalization/types'
import { motion } from 'motion/react'

interface ServicesProps {
  dictionary: Dictionary
}

export function Services({ dictionary }: ServicesProps) {
  const { services } = dictionary.marketing

  const items = [
    {
      type: services.items.sea.type,
      tags: [services.items.sea.tag1, services.items.sea.tag2],
      title: services.items.sea.title,
      description: services.items.sea.description,
      image: '/ship.jpg',
    },
    {
      type: services.items.air.type,
      tags: [services.items.air.tag1, services.items.air.tag2],
      title: services.items.air.title,
      description: services.items.air.description,
      image: '/plane.jpg',
    },
    {
      type: services.items.ground.type,
      tags: [services.items.ground.tag1, services.items.ground.tag2],
      title: services.items.ground.title,
      description: services.items.ground.description,
      image: '/contianer.jpg',
    },
  ]

  const titleWords = services.title.split(' ')

  return (
    <section id="services" className="py-20 bg-background">
      <div style={{ paddingInline: 'var(--container-padding)' }}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-14">
          <div className="lg:max-w-2xl">
            <span className="inline-block text-xs font-medium tracking-wider text-muted-foreground uppercase mb-4 px-4 py-1.5 border border-border rounded-full">
              {services.badge}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground leading-[1.15]">
              {titleWords.map((word, index) => (
                <motion.span
                  key={index}
                  className="inline-block me-[0.25em]"
                  initial={{ opacity: 0, y: 50, rotateX: -90 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: 0.1 + index * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </h2>
          </div>
          <p className="text-muted-foreground lg:max-w-sm lg:text-right lg:pt-12">
            {services.subtitle}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, index) => (
            <motion.div
              key={index}
              className="group"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Image with Tags */}
              <div className="relative aspect-[3/2] rounded-3xl overflow-hidden mb-5">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
                {/* Tags overlay */}
                <div className="absolute inset-0 p-5 flex flex-col items-start gap-2">
                  <span className="px-4 py-2 bg-black/25 backdrop-blur-md border border-white/60 rounded-full text-sm font-medium text-white">
                    {item.type}
                  </span>
                  <span className="px-4 py-2 bg-black/25 backdrop-blur-md border border-white/60 rounded-full text-sm font-medium text-white">
                    {item.tags[0]}
                  </span>
                  <span className="px-4 py-2 bg-black/25 backdrop-blur-md border border-white/60 rounded-full text-sm font-medium text-white">
                    {item.tags[1]}
                  </span>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
