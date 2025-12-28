export type TeamMemberRole = "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER"

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
}

export const roleOptions = [
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "MEMBER", label: "Member" },
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
