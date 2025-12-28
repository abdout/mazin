type IconKey = keyof typeof import("./icons").Icons

export type PlatformNavItem = {
  title: string
  href: string
  icon: IconKey
  roles: Role[]
  className?: string
}

export type Role = "ADMIN" | "MANAGER" | "VIEWER" | "USER"

const ALL_ROLES: Role[] = ["ADMIN", "MANAGER", "VIEWER", "USER"]

export const platformNav: PlatformNavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: "dashboard",
    roles: ALL_ROLES,
  },
  {
    title: "Shipments",
    href: "/shipments",
    icon: "ship",
    roles: ALL_ROLES,
  },
  {
    title: "Customs",
    href: "/customs",
    icon: "customs",
    roles: ALL_ROLES,
  },
  {
    title: "Invoices",
    href: "/invoice",
    icon: "invoice",
    roles: ALL_ROLES,
  },
  {
    title: "Finance",
    href: "/finance",
    icon: "finance",
    roles: ALL_ROLES,
  },
  {
    title: "Projects",
    href: "/project",
    icon: "project",
    roles: ALL_ROLES,
  },
  {
    title: "Tasks",
    href: "/task",
    icon: "task",
    roles: ALL_ROLES,
  },
  {
    title: "Customers",
    href: "/customer",
    icon: "customer",
    roles: ALL_ROLES,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "settings",
    roles: ALL_ROLES,
  },
]
