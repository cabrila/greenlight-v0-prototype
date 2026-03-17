"use client"
import * as React from "react"
import dynamic from "next/dynamic"
import type { ThemeProviderProps } from "next-themes"

// Dynamically import next-themes to avoid SSR script injection
const NextThemesProvider = dynamic(
  () => import("next-themes").then((mod) => mod.ThemeProvider),
  { 
    ssr: false,
    loading: () => null
  }
)

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
}
