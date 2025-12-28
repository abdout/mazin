import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function FinanceLayout({ children, params }: Props) {
  const { lang } = await params
  const isRTL = lang === "ar"

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={isRTL ? "المالية" : "Finance"} />
      {children}
    </div>
  )
}
