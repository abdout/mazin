"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { inviteStaff } from "./actions"

type Role = "ADMIN" | "MANAGER" | "CLERK" | "VIEWER"

export function InviteForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("CLERK")
  const [isPending, startTransition] = useTransition()
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await inviteStaff({ email, role })
      if (!result.success) {
        toast.error(result.error ?? "Failed to issue invite")
        return
      }
      toast.success("Invite issued")
      setInviteUrl(result.inviteUrl ?? null)
      setEmail("")
      router.refresh()
    })
  }

  function close() {
    setOpen(false)
    setInviteUrl(null)
  }

  async function copyLink() {
    if (!inviteUrl) return
    const fullUrl = `${window.location.origin}${inviteUrl}`
    await navigator.clipboard.writeText(fullUrl)
    toast.success("Link copied")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4 me-2" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite staff member</DialogTitle>
          <DialogDescription>
            The invitee receives a one-time link (valid 7 days) to set their password.
          </DialogDescription>
        </DialogHeader>

        {inviteUrl ? (
          <div className="space-y-3">
            <Label>Invite link</Label>
            <div className="flex gap-2">
              <Input readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}${inviteUrl}`} />
              <Button onClick={copyLink} type="button">Copy</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link via email or a secure channel. It expires in 7 days.
            </p>
            <DialogFooter>
              <Button onClick={close}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="staff@abdout.sd"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={role} onValueChange={v => setRole(v as Role)}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin — full access</SelectItem>
                  <SelectItem value="MANAGER">Manager — ops + approvals</SelectItem>
                  <SelectItem value="CLERK">Clerk — operational CRUD</SelectItem>
                  <SelectItem value="VIEWER">Viewer — read-only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !email}>
                {isPending ? "Sending…" : "Send invite"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
