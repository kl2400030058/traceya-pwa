"use client"

import { createContext, useContext, useEffect, useState } from "react"

interface PWAContextType {
  isInstallable: boolean
  isInstalled: boolean
  deferredPrompt: any
  setDeferredPrompt: (prompt: any) => void
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  isInstalled: false,
  deferredPrompt: null,
  setDeferredPrompt: () => {},
})

export const usePWA = () => useContext(PWAContext)

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== 'undefined') {
      // Check if already installed
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true)
      }

      // Listen for the beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: any) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault()
        // Stash the event so it can be triggered later
        setDeferredPrompt(e)
        setIsInstallable(true)
      }

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

      // Listen for app installed event
      window.addEventListener("appinstalled", () => {
        setIsInstalled(true)
        setIsInstallable(false)
        setDeferredPrompt(null)
      })

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      }
    }
  }, [])

  return (
    <PWAContext.Provider value={{ isInstallable, isInstalled, deferredPrompt, setDeferredPrompt }}>
      {children}
    </PWAContext.Provider>
  )
}