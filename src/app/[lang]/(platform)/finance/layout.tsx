import { redirect } from "next/navigation"

import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getAuthContext } from "@/lib/auth-context"
import { COMMUNITY_LOGIN_REDIRECT } from "@/routes"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function FinanceLayout({ children, params }: Props) {
  const { lang } = await params
  const locale = lang as "ar" | "en"

  // Defense-in-depth: middleware already redirects COMMUNITY users away from
  // /finance, but re-check at the layout boundary so any finance page render
  // (and the server actions invoked from it) is guaranteed to run as STAFF.
  const ctx = await getAuthContext()
  if (!ctx || ctx.userType !== "STAFF") {
    redirect(`/${locale}${COMMUNITY_LOGIN_REDIRECT}`)
  }

  const dict = await getDictionary(locale)

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={dict.finance?.title ?? "Finance"} />
      {children}
    </div>
  )
}
