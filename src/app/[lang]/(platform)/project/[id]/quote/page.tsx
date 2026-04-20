import { redirect } from "next/navigation"

export default async function QuotePage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { lang, id } = await params
  redirect(`/${lang}/invoice/new?projectId=${id}`)
}
