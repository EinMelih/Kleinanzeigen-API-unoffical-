"use client"

import * as React from "react"
import { type Theme } from "@/components/theme-provider"

export function useTheme() {
  const [theme, setTheme] = React.useState<Theme>("system")

  React.useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  return { theme, setTheme }
}
