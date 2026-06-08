import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listPendingInvites } from "./actions"
import { RevokeInviteButton } from "./revoke-invite-button"

export async function PendingInvites() {
  const invites = await listPendingInvites()
  if (invites.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Pending invites ({invites.length})</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-end">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map(inv => (
            <TableRow key={inv.id}>
              <TableCell className="text-sm">{inv.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{inv.role}</Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(inv.expiresAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-end">
                <RevokeInviteButton inviteId={inv.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
