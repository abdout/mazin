import { Construction } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface ComingSoonBannerProps {
  title?: string
  description?: string
  className?: string
}

/**
 * ComingSoonBanner - Visible banner indicating a feature is under development.
 *
 * Use on stub/placeholder pages to give users a clear signal that the feature
 * is planned but not yet available. Keep nav items visible (not hidden) so
 * users can see the product roadmap.
 */
export function ComingSoonBanner({
  title = "Coming Soon",
  description = "This feature is under active development. The interface below is a preview — data and actions are not yet functional.",
  className,
}: ComingSoonBannerProps) {
  return (
    <Alert
      className={cn(
        "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-100",
        className
      )}
    >
      <Construction className="text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">
        {title}
      </AlertTitle>
      <AlertDescription className="text-amber-800/80 dark:text-amber-200/80">
        {description}
      </AlertDescription>
    </Alert>
  )
}
