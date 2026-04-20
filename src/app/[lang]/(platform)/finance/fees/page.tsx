import { ComingSoonBanner } from "@/components/atom/coming-soon-banner"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import FeesContent from "@/components/platform/finance/fees/content"

export const metadata = { title: "Dashboard: Student Fees" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const finance = dictionary.finance as Record<string, unknown> | undefined

  return (
    <div className="space-y-6">
      <ComingSoonBanner
        title={(finance?.comingSoonTitle as string) ?? "Coming Soon"}
        description={(finance?.comingSoonDescription as string) ?? undefined}
      />
      <FeesContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
