'use client'

import { ArrowDownToLine, ArrowUpFromLine, Warehouse, Truck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dictionary } from '@/components/internationalization/types'

interface ServicesProps {
  dictionary: Dictionary
}

export function Services({ dictionary }: ServicesProps) {
  const { services } = dictionary.marketing

  const items = [
    {
      icon: ArrowDownToLine,
      title: services.import.title,
      description: services.import.description,
    },
    {
      icon: ArrowUpFromLine,
      title: services.export.title,
      description: services.export.description,
    },
    {
      icon: Warehouse,
      title: services.warehouse.title,
      description: services.warehouse.description,
    },
    {
      icon: Truck,
      title: services.transport.title,
      description: services.transport.description,
    },
  ]

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {services.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {services.subtitle}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
