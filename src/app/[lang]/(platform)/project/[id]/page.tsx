import React from "react"
import Action from "@/components/platform/project/layout/action"
import Info from "@/components/platform/project/detail/info"
import { getProject } from "@/components/platform/project/actions"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"

interface PageProps {
  params: Promise<{ id: string; lang: string }>
}

export default async function Detail({ params }: PageProps) {
  const { id, lang } = await params
  const dict = await getDictionary(lang as Locale)

  const result = await getProject(id)

  if (!result.success || !result.project) {
    const notFoundText = dict.project?.notFound ?? "Project not found"
    const loadErrorText = dict.project?.loadError ?? "Failed to load project"

    return (
      <div className="p-4">
        {result.success ? notFoundText : (result.error ?? loadErrorText)}
      </div>
    )
  }

  const project = result.project
  const fallbackTitle = dict.project?.shipmentFallback ?? "Shipment"

  const projectTitle =
    (typeof project.client === 'object' && project.client !== null
      ? (project.client as { companyName?: string }).companyName
      : undefined) ?? project.customer ?? fallbackTitle

  const info = dict.project?.info

  return (
    <div className="container mx-auto px-4 py-4">
      <Action projectTitle={projectTitle} />
      <Info
        project={project}
        labels={{
          sectionTitle: info?.sectionTitle,
          portOfOrigin: info?.portOfOrigin?.label,
          portOfDestination: info?.portOfDestination?.label,
          teamLead: info?.teamLead?.label,
          consignee: info?.consignee?.label,
          consignor: info?.consignor?.label,
          vessel: info?.vessel?.label,
          blAwbNumber: info?.blAwbNumber?.label,
          customer: info?.customer?.label,
          description: info?.description?.label,
          startDate: info?.startDate?.label,
          endDate: info?.endDate?.label,
          emptyPlaceholder: info?.emptyPlaceholder,
        }}
      />
    </div>
  )
}
