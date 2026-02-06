import { Suspense } from "react"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { NewPasswordForm } from "@/components/auth/password/form"

export default async function NewPasswordPage({
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
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{dict.auth?.newPassword || "New Password"}</h1>
          <p className="text-muted-foreground">{dict.auth?.newPasswordDescription || "Enter your new password"}</p>
        </div>
        <Suspense fallback={<div className="flex justify-center p-4">Loading...</div>}>
          <NewPasswordForm />
        </Suspense>
      </div>
    </main>
  )
}
