type IconKey = keyof typeof import("./icons").Icons

export type PlatformNavItem = {
  titleKey: string
  href: string
  icon: IconKey
  roles: Role[]
  className?: string
}

export type Role = "ADMIN" | "MANAGER" | "CLERK" | "VIEWER" | "USER"

const ALL_ROLES: Role[] = ["ADMIN", "MANAGER", "CLERK", "VIEWER", "USER"]

export const platformNav: PlatformNavItem[] = [
  {
    titleKey: "dashboard",
    href: "/dashboard",
    icon: "dashboard",
    roles: ALL_ROLES,
  },
  {
    titleKey: "shipments",
    href: "/project",
    icon: "ship",
    roles: ALL_ROLES,
  },
  {
    titleKey: "customs",
    href: "/customs",
    icon: "customs",
    roles: ALL_ROLES,
  },
  {
    titleKey: "invoices",
    href: "/invoice",
    icon: "invoice",
    roles: ALL_ROLES,
  },
  {
    titleKey: "finance",
    href: "/finance",
    icon: "finance",
    roles: ["ADMIN", "MANAGER", "CLERK"],
  },
  {
    titleKey: "task",
    href: "/task",
    icon: "task",
    roles: ALL_ROLES,
  },
  {
    titleKey: "customers",
    href: "/customer",
    icon: "customer",
    roles: ALL_ROLES,
  },
  {
    titleKey: "team",
    href: "/team",
    icon: "team",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    titleKey: "settings",
    href: "/settings",
    icon: "settings",
    roles: ALL_ROLES,
  },
]
