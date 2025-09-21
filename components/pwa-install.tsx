"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    const isInWebAppiOS = (window.navigator as any).standalone === true

    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true)
      return
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show install prompt after a delay (don't be too aggressive)
      setTimeout(() => {
        const dismissed = localStorage.getItem("pwa-install-dismissed")
        if (!dismissed) {
          setShowInstallPrompt(true)
        }
      }, 5000)
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log("[PWA] App was installed")
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    await deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice

    if (choiceResult.outcome === "accepted") {
      console.log("[PWA] User accepted the install prompt")
    } else {
      console.log("[PWA] User dismissed the install prompt")
    }

    // Clear the saved prompt as it can't be used again
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const dismissInstall = () => {
    setShowInstallPrompt(false)
    // Remember that the user dismissed the prompt
    localStorage.setItem("pwa-install-dismissed", "true")
  }

  if (isInstalled || !showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 py-2 md:bottom-4 md:right-4 md:left-auto md:max-w-sm">
      <Card className="border-primary/20 bg-card/95 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h3 className="mb-1 font-semibold">Install traceya</h3>
              <p className="text-sm text-muted-foreground">
                Add this app to your home screen for offline access and a better experience.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={handleInstall} className="gap-1.5">
                  <Download className="h-4 w-4" />
                  Install
                </Button>
                <Button size="sm" variant="ghost" onClick={dismissInstall}>
                  Not now
                </Button>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full"
              onClick={dismissInstall}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
