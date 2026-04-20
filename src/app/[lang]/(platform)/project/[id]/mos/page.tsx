import React from "react"
import Index from "@/components/platform/project/mos/index"
import Action from "@/components/platform/project/layout/action"
import { getProject } from "@/components/platform/project/actions"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"

interface PageProps {
  params: Promise<{
    id: string
    lang: string
  }>
}

export default async function MOS({ params }: PageProps) {
  const resolvedParams = await params
  const locale = resolvedParams.lang as Locale
  const isArabic = locale === "ar"
  const dict = await getDictionary(locale)

  // Fetch project data using server action
  const result = await getProject(resolvedParams.id)

  if (!result.success || !result.project) {
    return (
      <div className="p-8 text-center">
        {dict.project?.notFound ?? "Project not found"}
      </div>
    )
  }

  const project = result.project
  const fallbackTitle = dict.project?.shipmentFallback ?? "Shipment"
  const pageTitle =
    dict.project?.mos?.title ?? (isArabic ? "إجراءات التخليص" : "CLEARANCE PROCEDURES")
  const pageDescription =
    dict.project?.mos?.description ??
    (isArabic
      ? "إجراءات التشغيل الموحدة للتخليص الجمركي"
      : "Standard Operating Procedures for Custom Clearance")

  return (
    <div className="flex flex-col gap-8 mb-10">
      <Action projectTitle={project.customer || fallbackTitle} />
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground mt-2">{pageDescription}</p>
          {project.blAwbNumber && (
            <p className="text-sm text-muted-foreground mt-1">
              BL/AWB: {project.blAwbNumber}
            </p>
          )}
        </div>
        <Index params={params} />
      </div>
    </div>
  )
}
