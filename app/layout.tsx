import type React from "react"
import type { Metadata } from "next"
import { Gabarito } from 'next/font/google'
import "./globals.css"

const gabarito = Gabarito({
  subsets: ["latin"],
  variable: "--font-gabarito",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "GoGreenlight Casting",
  description: "Casting application prototype",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${gabarito.variable} antialiased`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}
