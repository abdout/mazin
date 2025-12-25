'use client'

import { Dictionary } from '@/components/internationalization/types'

interface ProcessProps {
  dictionary: Dictionary
}

export function Process({ dictionary }: ProcessProps) {
  const { process } = dictionary.marketing

  const steps = [
    { number: '01', ...process.step1 },
    { number: '02', ...process.step2 },
    { number: '03', ...process.step3 },
    { number: '04', ...process.step4 },
  ]

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {process.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {process.subtitle}
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 start-full w-full h-0.5 bg-border -z-10" />
              )}

              <div className="flex flex-col items-center text-center">
                {/* Step number */}
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-6">
                  {step.number}
                </div>

                {/* Step content */}
                <h3 className="text-xl font-semibold mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
