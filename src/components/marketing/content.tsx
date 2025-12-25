import { Dictionary } from '@/components/internationalization/types'
import { Hero } from './hero'
import { Stats } from './stats'
import { Services } from './services'
import { Process } from './process'
import { Features } from './features'
import { Cta } from './cta'

interface MarketingContentProps {
  dictionary: Dictionary
  lang: string
}

export function MarketingContent({ dictionary, lang }: MarketingContentProps) {
  return (
    <main className="min-h-screen">
      <Hero dictionary={dictionary} lang={lang} />
      <Stats dictionary={dictionary} />
      <Services dictionary={dictionary} />
      <Process dictionary={dictionary} />
      <Features dictionary={dictionary} />
      <Cta dictionary={dictionary} lang={lang} />
    </main>
  )
}
