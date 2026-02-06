import { Suspense } from "react"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { NewVerificationForm } from "@/components/auth/verification/form"

export default async function NewVerificationPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <Suspense fallback={<div className="flex justify-center p-4">Loading...</div>}>
          <NewVerificationForm />
        </Suspense>
      </div>
    </main>
  )
}
