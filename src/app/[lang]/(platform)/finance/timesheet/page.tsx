import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import TimesheetContent from "@/components/platform/finance/timesheet/content"

export const metadata = { title: "Dashboard: Timesheet Management" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <div className="space-y-6">
      <TimesheetContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
