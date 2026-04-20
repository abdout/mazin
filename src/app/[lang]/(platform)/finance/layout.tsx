import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function FinanceLayout({ children, params }: Props) {
  const { lang } = await params
  const dict = await getDictionary(lang as "ar" | "en")

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={dict.finance?.title ?? "Finance"} />
      {children}
    </div>
  )
}
