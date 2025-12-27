import { Dictionary } from '@/components/internationalization/types'
import type { Locale } from '@/components/internationalization/config'
import { SiteHeader } from '@/components/template/site-header'
import { Hero } from './hero'
import { Partners } from './partners'
import { Services } from './services'
import { AllInOne } from './all-in-one'
import { NumberSection } from './number'
import { TeamPage } from './board'
import { Insights } from './insights'
import { Faq } from './faq'
import ReadyToBuildSection from './ready-to-build'
import { Footer } from './footer'
import { Chatbot } from '@/components/chatbot'
import { LoadingWrapper } from './loading-wrapper'

interface MarketingContentProps {
  dictionary: Dictionary
  lang: string
}

export async function MarketingContent({ dictionary, lang }: MarketingContentProps) {
  return (
    <LoadingWrapper>
      <SiteHeader dictionary={dictionary} />
      <main className="min-h-screen">
        <Hero dictionary={dictionary} />
        <Partners />
        <Services dictionary={dictionary} />
        <AllInOne dictionary={dictionary} />
        <NumberSection dictionary={dictionary} />
        <TeamPage dictionary={dictionary} />
        <Insights dictionary={dictionary} />
        <Faq dictionary={dictionary} lang={lang} />
        <ReadyToBuildSection dictionary={dictionary} />
      </main>
      <Footer dictionary={dictionary} lang={lang} />
      <Chatbot lang={lang as Locale} />
    </LoadingWrapper>
  )
}
