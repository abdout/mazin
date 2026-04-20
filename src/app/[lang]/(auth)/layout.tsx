import { ReportIssue } from "@/components/report-issue"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-muted/50 px-4 sm:px-6">
      {children}
      <div className="fixed bottom-4 start-4 z-50">
        <ReportIssue />
      </div>
    </div>
  )
}
