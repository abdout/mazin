"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function BankingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams()
  const lang = params?.lang as string || "ar"
  const isRTL = lang === "ar"

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Banking module error:", error)
  }, [error])

  const translations = {
    title: isRTL ? "حدث خطأ ما!" : "Something went wrong!",
    defaultMessage: isRTL
      ? "حدث خطأ أثناء تحميل معلوماتك المصرفية."
      : "An error occurred while loading your banking information.",
    errorId: isRTL ? "معرف الخطأ:" : "Error ID:",
    goToDashboard: isRTL ? "الذهاب للوحة التحكم" : "Go to Dashboard",
    tryAgain: isRTL ? "حاول مرة أخرى" : "Try again",
  }

  return (
    <div className="layout-container flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-5 w-5" />
            <CardTitle>{translations.title}</CardTitle>
          </div>
          <CardDescription>
            {error.message || translations.defaultMessage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {error.digest && (
              <>
                {translations.errorId} <code className="text-xs">{error.digest}</code>
              </>
            )}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => (window.location.href = `/${lang}/finance/banking`)}
          >
            {translations.goToDashboard}
          </Button>
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4 me-2" />
            {translations.tryAgain}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
