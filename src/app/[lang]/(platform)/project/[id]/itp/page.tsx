import React from "react"
import Index from "@/components/platform/project/itp/index"
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

export default async function ITP({ params }: PageProps) {
  const resolvedParams = await params
  const locale = resolvedParams.lang as Locale
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
  const checklistTitle = dict.project?.itp?.title ?? "Document Checklist"

  return (
    <div className="flex flex-col gap-8 mb-10">
      <Action projectTitle={project.customer || fallbackTitle} />
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-center">{checklistTitle}</h1>
        <p className="text-center text-muted-foreground">
          {project.blAwbNumber && `BL/AWB: ${project.blAwbNumber}`}
        </p>
        <Index params={params} />
      </div>
    </div>
  )
}
