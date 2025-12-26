"use client"

import React from "react"
import { MobileNav } from "./mobile-nav"
import { RightActions } from "./right-actions"
import type { Dictionary } from "@/components/internationalization"

interface MobileHeaderProps {
  dictionary: Dictionary
}

export default function MobileHeader({ dictionary }: MobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] md:hidden bg-background">
      <div className="layout-container flex h-14 items-center">
        <div className="flex items-center justify-between w-full">
          <MobileNav dictionary={dictionary} />
          <RightActions />
        </div>
      </div>
    </header>
  )
}
