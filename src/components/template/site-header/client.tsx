"use client"

import React from "react"
import { MainNav } from "./main-nav"
import { RightActions } from "./right-actions"
import MobileHeader from "./mobile-header"
import type { Dictionary } from "@/components/internationalization"

interface SiteHeaderClientProps {
  dictionary: Dictionary
}

export default function SiteHeaderClient({ dictionary }: SiteHeaderClientProps) {
  return (
    <>
      {/* Desktop Header */}
      <header className="fixed z-50 top-0 inset-x-0 hidden md:block bg-background">
        <div className="layout-container">
          <div className="flex h-16 items-center justify-between">
            {/* Logo + Nav - Left */}
            <MainNav dictionary={dictionary} />
            {/* Actions - Right */}
            <RightActions />
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <MobileHeader dictionary={dictionary} />
    </>
  )
}
