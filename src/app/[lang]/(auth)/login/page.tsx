import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { LoginForm } from "@/components/platform/auth/login-form"

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{dict.auth.welcomeBack}</h1>
          <p className="text-muted-foreground">{dict.auth.login}</p>
        </div>
        <LoginForm dictionary={dict} />
      </div>
    </main>
  )
}
