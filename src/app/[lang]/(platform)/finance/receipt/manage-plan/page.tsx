import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTemporaryAccessToken } from "@/components/platform/finance/receipt/schematic/get-temporary-access-token"
import SchematicEmbed from "@/components/platform/finance/receipt/schematic/schematic-embed"
import { logger } from "@/lib/logger"

const log = logger.forModule("finance.manage-plan")

const copy = {
  ar: {
    title: "إدارة الاشتراك",
    description: "عرض وإدارة خطة اشتراكك",
    unavailableTitle: "تعذر تحميل بوابة الاشتراك",
    unavailableDescription: "يرجى المحاولة لاحقًا أو التواصل مع الدعم.",
    configTitle: "خطأ في الإعداد",
    configDescription: "بوابة الاشتراك غير مهيأة.",
  },
  en: {
    title: "Manage Subscription",
    description: "View and manage your subscription plan",
    unavailableTitle: "Unable to load subscription portal",
    unavailableDescription: "Please try again later or contact support.",
    configTitle: "Configuration Error",
    configDescription: "Subscription portal is not configured.",
  },
} as const

export default async function ManagePlanPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang === "en" ? "en" : "ar"
  const t = copy[locale]

  const session = await auth()

  if (!session?.user) {
    redirect(`/${lang}/login`)
  }

  const accessToken = await getTemporaryAccessToken()

  if (!accessToken) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">{t.unavailableTitle}</h1>
        <p className="text-muted-foreground">{t.unavailableDescription}</p>
      </div>
    )
  }

  const componentId =
    process.env.NEXT_PUBLIC_SCHEMATIC_CUSTOMER_PORTAL_COMPONENT_ID

  if (!componentId) {
    log.error("NEXT_PUBLIC_SCHEMATIC_CUSTOMER_PORTAL_COMPONENT_ID not set")
    return (
      <div className="py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">{t.configTitle}</h1>
        <p className="text-muted-foreground">{t.configDescription}</p>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground mt-2">{t.description}</p>
      </div>

      <div className="bg-card rounded-lg border">
        <SchematicEmbed accessToken={accessToken} componentId={componentId} />
      </div>
    </div>
  )
}
