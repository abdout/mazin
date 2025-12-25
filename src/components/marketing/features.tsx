'use client'

import { MapPin, Receipt, FileText, Shield } from 'lucide-react'
import { Dictionary } from '@/components/internationalization/types'

interface FeaturesProps {
  dictionary: Dictionary
}

export function Features({ dictionary }: FeaturesProps) {
  const { features } = dictionary.marketing

  const items = [
    {
      icon: MapPin,
      title: features.tracking.title,
      description: features.tracking.description,
      borderColor: 'border-blue-500',
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Receipt,
      title: features.invoicing.title,
      description: features.invoicing.description,
      borderColor: 'border-cyan-500',
      iconColor: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      icon: FileText,
      title: features.documents.title,
      description: features.documents.description,
      borderColor: 'border-teal-500',
      iconColor: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
    },
    {
      icon: Shield,
      title: features.access.title,
      description: features.access.description,
      borderColor: 'border-emerald-500',
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ]

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {features.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {features.subtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <div
              key={index}
              className={`group p-6 rounded-2xl border-2 ${item.borderColor} bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center mb-4`}>
                <item.icon className={`w-6 h-6 ${item.iconColor}`} />
              </div>

              <h3 className="text-xl font-semibold mb-3">
                {item.title}
              </h3>

              <p className="text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
