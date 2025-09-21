import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
// @vercel/analytics is already installed
import { Analytics } from '@vercel/analytics/react'
import { Suspense } from "react"
import { PWAInstall } from "@/components/pwa-install"
import { MainNav } from "@/components/main-nav"
import { PWAProvider } from "@/app/pwa"
import "./globals.css"

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true
}

export const metadata: Metadata = {
  title: "traceya - Herb Collection Tracker",
  description: "Geo-tagged Ayurvedic herb collection app for farmers",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "traceya",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <PWAProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <MainNav />
          <PWAInstall />
          <Analytics />
        </PWAProvider>
      </body>
    </html>
  )
}
