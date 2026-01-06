import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import TaskDetailClient from "./task-detail-client"

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { lang, id } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  return <TaskDetailClient taskId={id} locale={locale} dictionary={dict} />
}
