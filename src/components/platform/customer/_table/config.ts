import {
  IconUserCheck,
  IconUserOff,
} from "@tabler/icons-react"

import type { Option } from "@/components/table/types/data-table"

// Status configuration
export const clientStatusConfig = {
  active: {
    label: "Active",
    icon: IconUserCheck,
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  inactive: {
    label: "Inactive",
    icon: IconUserOff,
    className: "bg-muted text-muted-foreground border-muted",
  },
} as const

export type ClientStatusKey = keyof typeof clientStatusConfig

// Filter options
export const clientStatusOptions: Option[] = [
  {
    value: "true",
    label: "Active",
    icon: IconUserCheck,
  },
  {
    value: "false",
    label: "Inactive",
    icon: IconUserOff,
  },
]
