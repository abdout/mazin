import PageHeading from "@/components/atom/page-heading"
import { ShipmentIntakeForm } from "@/components/platform/shipments/form"
import type { Locale } from "@/components/internationalization"

export default async function NewShipmentPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <PageHeading title="New shipment" description="Register a new import or export shipment." />
      <ShipmentIntakeForm lang={locale} />
    </div>
  )
}
