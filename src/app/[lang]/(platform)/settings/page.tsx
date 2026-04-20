import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">{dict.settings?.title ?? (locale === "ar" ? "الإعدادات" : "Settings")}</h1>
      </div>
      <div className="px-4 lg:px-6">
        <Card className="max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-muted rounded-full">
                <Settings className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <CardTitle>
              {locale === "ar" ? "قريباً" : "Coming Soon"}
            </CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "إعدادات الملف الشخصي والأمان قيد التطوير."
                : "Profile and security settings are under development."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
