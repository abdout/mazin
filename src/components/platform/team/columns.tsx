"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Mail, Shield, UserCheck, UserX, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Dictionary } from "@/components/internationalization"
import type { TeamMember, TeamMemberRole, TeamMemberStatus } from "./types"

interface GetColumnsOptions {
  dictionary: Dictionary
  onEdit?: (member: TeamMember) => void
  onDelete?: (id: string) => void
  onChangeRole?: (id: string, role: TeamMemberRole) => void
  onChangeStatus?: (id: string, status: TeamMemberStatus) => void
}

const statusConfig: Record<TeamMemberStatus, { icon: typeof UserCheck; className: string }> = {
  ACTIVE: {
    icon: UserCheck,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  INACTIVE: {
    icon: UserX,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  },
  PENDING: {
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
}

const roleConfig: Record<TeamMemberRole, { className: string }> = {
  ADMIN: { className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  MANAGER: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  MEMBER: { className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  VIEWER: { className: "bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400" },
}

export function getColumns({
  dictionary,
  onEdit,
  onDelete,
  onChangeRole,
  onChangeStatus,
}: GetColumnsOptions): ColumnDef<TeamMember>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: dictionary.team?.name || "Name",
      cell: ({ row }) => {
        const member = row.original
        const initials = member.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)

        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{member.name}</span>
              <span className="text-muted-foreground text-xs">{member.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: dictionary.team?.role || "Role",
      cell: ({ row }) => {
        const role = row.original.role
        const config = roleConfig[role]
        return (
          <Badge variant="secondary" className={config.className}>
            <Shield className="me-1 size-3" />
            {dictionary.team?.roles?.[role.toLowerCase() as keyof typeof dictionary.team.roles] || role}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "department",
      header: dictionary.team?.department || "Department",
      cell: ({ row }) => {
        const dept = row.original.department
        return dept ? (
          <span className="text-muted-foreground">{dept}</span>
        ) : (
          <span className="text-muted-foreground/50">-</span>
        )
      },
    },
    {
      accessorKey: "status",
      header: dictionary.team?.status || "Status",
      cell: ({ row }) => {
        const status = row.original.status
        const config = statusConfig[status]
        const StatusIcon = config.icon
        return (
          <Badge variant="secondary" className={config.className}>
            <StatusIcon className="me-1 size-3" />
            {dictionary.team?.statuses?.[status.toLowerCase() as keyof typeof dictionary.team.statuses] || status}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "joinedAt",
      header: dictionary.team?.joinedAt || "Joined",
      cell: ({ row }) => {
        const date = new Date(row.original.joinedAt)
        return <span className="text-muted-foreground">{date.toLocaleDateString()}</span>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const member = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{dictionary.common?.actions || "Actions"}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(member.email)}>
                <Mail className="me-2 size-4" />
                {dictionary.team?.copyEmail || "Copy email"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(member)}>
                {dictionary.common?.edit || "Edit"}
              </DropdownMenuItem>
              {onChangeRole && (
                <DropdownMenuItem onClick={() => onChangeRole(member.id, "MANAGER")}>
                  {dictionary.team?.changeRole || "Change role"}
                </DropdownMenuItem>
              )}
              {onChangeStatus && member.status === "ACTIVE" && (
                <DropdownMenuItem onClick={() => onChangeStatus(member.id, "INACTIVE")}>
                  {dictionary.team?.deactivate || "Deactivate"}
                </DropdownMenuItem>
              )}
              {onChangeStatus && member.status === "INACTIVE" && (
                <DropdownMenuItem onClick={() => onChangeStatus(member.id, "ACTIVE")}>
                  {dictionary.team?.activate || "Activate"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(member.id)}
                className="text-destructive focus:text-destructive"
              >
                {dictionary.common?.delete || "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
