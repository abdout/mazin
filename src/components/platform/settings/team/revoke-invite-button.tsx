"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { revokeInvite } from "./actions"

export function RevokeInviteButton({ inviteId }: { inviteId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await revokeInvite(inviteId)
          if (result.success) {
            toast.success("Invite revoked")
            router.refresh()
          } else {
            toast.error(result.error ?? "Failed to revoke")
          }
        })
      }
    >
      Revoke
    </Button>
  )
}
