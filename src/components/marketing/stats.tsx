'use client'

import { Calendar, Package, Users, Clock } from 'lucide-react'
import { Dictionary } from '@/components/internationalization/types'

interface StatsProps {
  dictionary: Dictionary
}

export function Stats({ dictionary }: StatsProps) {
  const { stats } = dictionary.marketing

  const items = [
    {
      icon: Calendar,
      value: stats.yearsValue,
      label: stats.years,
    },
    {
      icon: Package,
      value: stats.shipmentsValue,
      label: stats.shipments,
    },
    {
      icon: Users,
      value: stats.clientsValue,
      label: stats.clients,
    },
    {
      icon: Clock,
      value: stats.clearanceTimeValue,
      label: stats.clearanceTime,
    },
  ]

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-6"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                {item.value}
              </div>
              <div className="text-sm sm:text-base text-muted-foreground">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
