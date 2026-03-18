"use client"
import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Render children immediately but only wrap with NextThemesProvider after mount
  // This prevents the script injection warning while still allowing content to render
  if (!mounted) {
    // Return children without theme provider during SSR/initial render
    // This prevents the script tag warning
    return <>{children}</>
  }

  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
}
