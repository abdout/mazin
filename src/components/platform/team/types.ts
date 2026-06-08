// Role enum mirrors the `UserRole` Prisma enum exactly so changes flow from the
// schema (auth.prisma) instead of drifting in the UI layer. Older code used
// "MEMBER" — that is now `CLERK`.
export type TeamMemberRole = "ADMIN" | "MANAGER" | "CLERK" | "VIEWER"

export type TeamMemberStatus = "ACTIVE" | "INACTIVE" | "PENDING"

export interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamMemberRole
  status: TeamMemberStatus
  department?: string
  avatar?: string
  joinedAt: Date
  lastActive?: Date
  /** Tasks open + completed over the last 7 days, used for load display. */
  load?: { open: number; done7d: number }
}

export const roleOptions = [
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "CLERK", label: "Clerk" },
  { value: "VIEWER", label: "Viewer" },
] as const

export const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "PENDING", label: "Pending" },
] as const

export const departmentOptions = [
  { value: "engineering", label: "Engineering" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "hr", label: "Human Resources" },
] as const
