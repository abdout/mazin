import "server-only"
import type { Locale } from "./config"
import type { Dictionary } from "./types"

const dictionaries = {
  ar: () => import("./ar.json").then((module) => module.default as Dictionary),
  en: () => import("./en.json").then((module) => module.default as Dictionary),
} as const

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  try {
    return await (dictionaries[locale]?.() ?? dictionaries["ar"]())
  } catch (error) {
    console.warn(`Failed to load dictionary for locale: ${locale}. Falling back to ar.`)
    return await dictionaries["ar"]()
  }
}
