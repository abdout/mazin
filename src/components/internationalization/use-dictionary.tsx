"use client"

import * as React from "react"
import type { Dictionary } from "./types"

const DictionaryContext = React.createContext<Dictionary | null>(null)

export function DictionaryProvider({
  dictionary,
  children,
}: {
  dictionary: Dictionary
  children: React.ReactNode
}) {
  return (
    <DictionaryContext.Provider value={dictionary}>
      {children}
    </DictionaryContext.Provider>
  )
}

export function useDictionary(): Dictionary {
  const dictionary = React.useContext(DictionaryContext)
  if (!dictionary) {
    throw new Error("useDictionary must be used within a DictionaryProvider")
  }
  return dictionary
}
