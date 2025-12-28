"use client"

import { useEffect } from "react"

import { usePageHeading } from "./page-heading-context"

interface PageHeadingSetterProps {
  title: string
  description?: string
}

/**
 * Component to set page heading from server components
 * Use this in page.tsx files to set the heading displayed in the layout
 */
export function PageHeadingSetter({ title, description }: PageHeadingSetterProps) {
  const { setHeading, clearHeading } = usePageHeading()

  useEffect(() => {
    setHeading({ title, description })
    return () => clearHeading()
  }, [title, description, setHeading, clearHeading])

  return null
}
