"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authManager } from "@/lib/auth"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check if onboarding is completed
        const onboardingCompleted = localStorage.getItem("traceya_onboarding_completed")

        if (!onboardingCompleted) {
          router.push("/onboarding")
          return
        }

        // Check authentication
        if (authManager.isAuthenticated()) {
          router.push("/dashboard")
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Navigation error:", error)
        // Fallback to login page if there's an error
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    // Add a small timeout to ensure the router is ready
    const timer = setTimeout(() => {
      checkAuthAndRedirect()
    }, 500)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading traceya...</p>
        {!isLoading && <button 
          onClick={() => router.push('/login')} 
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
          Go to Login
        </button>}
      </div>
    </div>
  )
}
