"use client"

import { PageErrorBoundary } from "@/components/error-boundary"

export default function RouteError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <PageErrorBoundary {...props} cta="dashboard" />
}
