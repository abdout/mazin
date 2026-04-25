import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { ShipmentsContent } from "@/components/platform/shipments/content"

export default async function ShipmentsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  return <ShipmentsContent lang={locale} dict={dict} />
}
