import React from "react"
import { ProjectProvider } from "@/provider/project"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import ProjectTabs from "./project-tabs"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string; lang: string }>
}

const Layout = async ({ children, params }: LayoutProps) => {
  const { id, lang } = await params
  const dict = await getDictionary(lang as Locale)
  const basePath = `/${lang}/project/${id}`

  const tabs = [
    { label: dict.project?.tabs?.overview ?? "Overview", path: '' },
    { label: dict.project?.tabs?.docs ?? "Docs", path: '/docs' },
    { label: dict.project?.tabs?.invoices ?? "Invoices", path: '/invoices' },
    { label: dict.project?.tabs?.acd ?? "ACD", path: '/acd' },
    { label: dict.project?.tabs?.containers ?? "Containers", path: '/containers' },
    { label: dict.project?.tabs?.payments ?? "Payments", path: '/payments' },
    { label: dict.project?.tabs?.duty ?? "Duty", path: '/duty' },
  ]

  return (
    <ProjectProvider>
      <div>
        <ProjectTabs tabs={tabs} basePath={basePath} />
        <main>
          {children}
        </main>
      </div>
    </ProjectProvider>
  )
}

export default Layout
