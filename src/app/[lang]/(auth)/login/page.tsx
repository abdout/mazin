import { Suspense } from "react"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { LoginForm } from "@/components/auth/login/form"

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="flex justify-center p-4">Loading...</div>}>
          <LoginForm dictionary={dict} />
        </Suspense>
      </div>
    </main>
  )
}
