'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Dictionary } from '@/components/internationalization/types'

interface CtaProps {
  dictionary: Dictionary
  lang: string
}

export function Cta({ dictionary, lang }: CtaProps) {
  const { cta } = dictionary.marketing

  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {cta.title}
          </h2>

          <p className="text-lg opacity-90 mb-8">
            {cta.subtitle}
          </p>

          <Button
            asChild
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-6"
          >
            <Link href={`/${lang}/login`}>
              {cta.button}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
