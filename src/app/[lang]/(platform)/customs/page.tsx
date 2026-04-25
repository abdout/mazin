import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { CustomsContent } from "@/components/platform/customs/content"

export default async function CustomsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  return <CustomsContent lang={locale} dict={dict} />
}
