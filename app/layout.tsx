import type React from "react" // Good practice to import React
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css" // Your global styles
import { ThemeProvider } from "@/components/theme-provider" // CRITICAL: Ensure this path is correct

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GoGreenlight Casting", // Or your application's title
  description: "Casting application prototype", // Or your application's description
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class" // CRITICAL: This tells next-themes to use class-based theming
          defaultTheme="light" // Sets the default theme (can be "light", "dark", or "system")
          enableSystem // Allows respecting the user's OS preference
          disableTransitionOnChange // Optional: can prevent style flashing on theme change
        >
          {children} {/* Your application content */}
        </ThemeProvider>
      </body>
    </html>
  )
}
