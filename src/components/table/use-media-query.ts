import * as React from "react"

export function useMediaQuery(query: string) {
  const subscribe = React.useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined") return () => {}
      const result = window.matchMedia(query)
      result.addEventListener("change", callback)
      return () => result.removeEventListener("change", callback)
    },
    [query]
  )

  const getSnapshot = React.useCallback(() => {
    return window.matchMedia(query).matches
  }, [query])

  const getServerSnapshot = React.useCallback(() => false, [])

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
