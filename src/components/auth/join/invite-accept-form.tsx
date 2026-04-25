"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { acceptInvite } from "@/components/platform/settings/team/actions"

export function InviteAcceptForm({ token, lang }: { token: string; lang: string }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    startTransition(async () => {
      const result = await acceptInvite({ token, name, password })
      if (!result.success) {
        toast.error(result.error ?? "Failed to accept invite")
        return
      }
      toast.success("Account created — sign in with your new credentials")
      router.push(`/${lang}/login`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="accept-name">Your name</Label>
        <Input
          id="accept-name"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Full name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="accept-password">Password</Label>
        <Input
          id="accept-password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </div>
      <Button type="submit" disabled={isPending || !name || password.length < 8} className="w-full">
        {isPending ? "Creating account…" : "Accept invite"}
      </Button>
    </form>
  )
}
