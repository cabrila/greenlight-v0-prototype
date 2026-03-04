import type React from "react"
import type { Metadata } from "next"
import { Gabarito } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const gabarito = Gabarito({
  subsets: ["latin"],
  variable: "--font-gabarito",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
})

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
    <html lang="en" suppressHydrationWarning className={`${gabarito.variable} antialiased`}>
      <body className="font-sans">
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
