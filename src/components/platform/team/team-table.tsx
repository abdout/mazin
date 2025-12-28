"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"
import { Search, Filter, X, UserPlus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExportButton } from "@/components/export"
import type { Dictionary, Locale } from "@/components/internationalization"
import { getColumns } from "./columns"
import { roleOptions, statusOptions, type TeamMember, type TeamMemberRole, type TeamMemberStatus } from "./types"

interface TeamTableProps {
  data: TeamMember[]
  dictionary: Dictionary
  locale: Locale
  onAdd?: () => void
  onEdit?: (member: TeamMember) => void
  onDelete?: (id: string) => void
  onChangeRole?: (id: string, role: TeamMemberRole) => void
  onChangeStatus?: (id: string, status: TeamMemberStatus) => void
}

export function TeamTable({
  data,
  dictionary,
  locale,
  onAdd,
  onEdit,
  onDelete,
  onChangeRole,
  onChangeStatus,
}: TeamTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [roleFilter, setRoleFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [rowSelection, setRowSelection] = useState({})

  const filteredData = useMemo(() => {
    return data.filter((member) => {
      // Role filter
      if (roleFilter.length > 0 && !roleFilter.includes(member.role)) {
        return false
      }
      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(member.status)) {
        return false
      }
      // Global search filter
      if (globalFilter) {
        const searchLower = globalFilter.toLowerCase()
        return (
          member.name.toLowerCase().includes(searchLower) ||
          member.email.toLowerCase().includes(searchLower) ||
          member.department?.toLowerCase().includes(searchLower) ||
          member.role.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
  }, [data, roleFilter, statusFilter, globalFilter])

  const columns = useMemo(
    () =>
      getColumns({
        dictionary,
        onEdit,
        onDelete,
        onChangeRole,
        onChangeStatus,
      }),
    [dictionary, onEdit, onDelete, onChangeRole, onChangeStatus]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
  })

  const toggleRoleFilter = (role: string) => {
    setRoleFilter((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  const clearFilters = () => {
    setGlobalFilter("")
    setRoleFilter([])
    setStatusFilter([])
  }

  const hasActiveFilters = globalFilter || roleFilter.length > 0 || statusFilter.length > 0

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Search and Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="text-muted-foreground absolute start-2.5 top-1/2 size-4 -translate-y-1/2" />
            <Input
              placeholder={dictionary.common?.search || "Search..."}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9 w-40 pe-8 ps-8 lg:w-64"
            />
            {globalFilter && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute end-1 top-1/2 size-6 -translate-y-1/2"
                onClick={() => setGlobalFilter("")}
              >
                <X className="size-3" />
              </Button>
            )}
          </div>

          {/* Role Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="me-2 size-4" />
                {dictionary.team?.role || "Role"}
                {roleFilter.length > 0 && (
                  <Badge variant="secondary" className="ms-2 rounded-full px-1.5">
                    {roleFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {roleOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={roleFilter.includes(option.value)}
                  onCheckedChange={() => toggleRoleFilter(option.value)}
                >
                  {dictionary.team?.roles?.[option.value.toLowerCase() as keyof typeof dictionary.team.roles] ||
                    option.label}
                </DropdownMenuCheckboxItem>
              ))}
              {roleFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setRoleFilter([])}>
                    {dictionary.common?.clear || "Clear"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="me-2 size-4" />
                {dictionary.team?.status || "Status"}
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ms-2 rounded-full px-1.5">
                    {statusFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {statusOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={statusFilter.includes(option.value)}
                  onCheckedChange={() => toggleStatusFilter(option.value)}
                >
                  {dictionary.team?.statuses?.[option.value.toLowerCase() as keyof typeof dictionary.team.statuses] ||
                    option.label}
                </DropdownMenuCheckboxItem>
              ))}
              {statusFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter([])}>
                    {dictionary.common?.clear || "Clear"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
              <X className="me-1 size-4" />
              {dictionary.common?.reset || "Reset"}
            </Button>
          )}
        </div>

        {/* Right: Export and Add */}
        <div className="flex items-center gap-2">
          <ExportButton
            data={filteredData}
            filename="team-members"
            variant="outline"
            size="sm"
            dictionary={dictionary}
          />
          {onAdd && (
            <Button size="sm" className="h-9" onClick={onAdd}>
              <UserPlus className="me-2 size-4" />
              {dictionary.team?.addMember || "Add Member"}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {dictionary.common?.noResults || "No results found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} {dictionary.table?.of ?? "of"}{" "}
          {table.getFilteredRowModel().rows.length} {dictionary.table?.rowsSelected ?? "row(s) selected"}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {dictionary.common?.previous || "Previous"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {dictionary.common?.next || "Next"}
          </Button>
        </div>
      </div>
    </div>
  )
}
