import { Metadata } from "next"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { FinanceDashboardContent } from "@/components/platform/finance/dashboard/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const isRTL = locale === "ar"

  return {
    title: isRTL
      ? `${dict.finance?.dashboard ?? "لوحة المالية"} | ${dict.finance?.title ?? "المالية"}`
      : `${dict.finance?.dashboard ?? "Financial Dashboard"} | ${dict.finance?.title ?? "Finance"}`,
    description: isRTL
      ? "نظرة شاملة على الأداء المالي للشركة"
      : "Comprehensive financial overview and key performance indicators",
  }
}

export default async function FinanceDashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  return <FinanceDashboardContent locale={locale} dictionary={dict} />
}
