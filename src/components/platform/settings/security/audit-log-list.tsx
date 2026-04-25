import { db } from "@/lib/db"
import { requireStaff } from "@/lib/auth-context"
import { requireCan } from "@/lib/authorization"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Read-only view of the last 50 audit events. Admins-and-managers only —
 * `can(ctx, 'read', 'audit-log')` is in the matrix.
 */
export async function AuditLogList() {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "audit-log")

  const rows = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          No audit events yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit log</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => (
              <TableRow key={row.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(row.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-xs">{row.actorEmail ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {row.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {row.resource ? `${row.resource}${row.resourceId ? `/${row.resourceId.slice(0, 8)}` : ""}` : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {row.ipAddress ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
