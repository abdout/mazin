import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import PaymentTransferContent from "@/components/platform/finance/banking/payment-transfer/content"

export default async function PaymentTransferPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await auth()

  if (!session?.user) {
    return null // Layout handles redirect
  }

  return (
    <PaymentTransferContent
      user={session.user}
      dictionary={undefined}
      lang={lang as Locale}
    />
  )
}
