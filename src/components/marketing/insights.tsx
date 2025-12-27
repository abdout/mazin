'use client'

import Image from 'next/image'
import { Dictionary } from '@/components/internationalization/types'

// Static featured articles data
const FEATURED_ARTICLES = [
  { slug: 'sudan-customs-digital-system', image: '/blog/sudan-customs.jpg' },
  { slug: 'red-sea-shipping-crisis', image: '/blog/red-sea.jpg' },
  { slug: 'port-sudan-operations-update', image: '/blog/port-sudan.jpg' },
]

interface InsightsProps {
  dictionary: Dictionary
}

export function Insights({ dictionary }: InsightsProps) {
  const { insights } = dictionary.marketing
  const featuredArticles = FEATURED_ARTICLES

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div style={{ paddingInline: 'var(--container-padding)' }}>
        {/* Section Header */}
        <div className="mb-12">
          {/* Badge */}
          <span className="inline-block text-sm font-medium text-foreground border border-border rounded-full px-4 py-1 mb-6">
            {insights.badge}
          </span>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-foreground leading-tight">
            {insights.title}
          </h2>
        </div>

        {/* Articles Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featuredArticles.map((article) => {
            const articleContent = insights.articles[article.slug as keyof typeof insights.articles]
            if (!articleContent) return null

            return (
              <article key={article.slug} className="group">
                {/* Card Container */}
                <div className="rounded-md overflow-hidden border border-border">
                  {/* Image Container */}
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={article.image}
                      alt={articleContent.title}
                      fill
                      className="object-cover"
                    />
                    {/* Date Badge */}
                    <div className="absolute top-4 end-4">
                      <span className="px-4 py-2 bg-black/25 backdrop-blur-md border border-white/60 rounded-full text-sm font-medium text-white">
                        {articleContent.date}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3 bg-card">
                    {/* Category Badge */}
                    <span className="inline-block text-sm text-muted-foreground border border-border rounded-full px-4 py-1">
                      {articleContent.category}
                    </span>

                    {/* Title */}
                    <h3 className="text-foreground text-lg font-semibold">
                      {articleContent.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground text-base leading-relaxed line-clamp-2">
                      {articleContent.description}
                    </p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
