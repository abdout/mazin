import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function CustomsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{dict.customs.title}</h1>
        <Button asChild>
          <Link href={`/${lang}/customs/new`}>
            <Plus className="h-4 w-4 me-2" />
            {dict.customs.newDeclaration}
          </Link>
        </Button>
      </div>

      <div className="text-muted-foreground">
        {dict.common.noResults}
      </div>
    </div>
  )
}
