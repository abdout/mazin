"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

/**
 * Lightweight Switch component built on top of a native checkbox.
 * Uses no external dependencies — relies on Tailwind for styling and
 * peer state to drive the thumb position. RTL-safe via logical transforms.
 */
const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, defaultChecked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <label
        className={cn(
          "relative inline-flex h-[1.15rem] w-8 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs transition-all",
          "bg-input has-[:checked]:bg-primary has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-[3px]",
          "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          onChange={(event) => onCheckedChange?.(event.target.checked)}
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none block size-4 rounded-full bg-background shadow-xs ring-0 transition-transform",
            "translate-x-0 peer-checked:translate-x-[calc(100%-2px)]",
            "rtl:-translate-x-0 rtl:peer-checked:-translate-x-[calc(100%-2px)]"
          )}
        />
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
