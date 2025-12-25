import Link from "next/link"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { Button } from "@/components/ui/button"

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">{dict.common.appName}</h1>
        <p className="text-muted-foreground text-lg">
          Port Sudan Export/Import Management System
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href={`/${lang}/login`}>{dict.auth.login}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${lang}/dashboard`}>{dict.navigation.dashboard}</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
