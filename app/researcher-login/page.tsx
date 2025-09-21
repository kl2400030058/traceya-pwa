"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authManager } from "@/lib/auth"
import { sendOtp, validateOTP } from "@/lib/otp"

export default function ResearcherLoginPage() {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otpValue, setOtpValue] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Check if already authenticated
    if (authManager.isAuthenticated()) {
      if (authManager.isResearcher()) {
        router.push("/researcher")
      } else {
        // If logged in as farmer, log out first
        authManager.logout()
      }
    }
  }, [])

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // In a real app, this would send an OTP via SMS
      // For demo, we'll just simulate it
      await sendOtp(phoneNumber)
      setIsOtpSent(true)
    } catch (error) {
      setError("Failed to send OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!otpValue || otpValue.length < 4) {
      setError("Please enter a valid OTP")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Login as researcher
      const success = await authManager.login(phoneNumber, otpValue, "researcher")
      if (success) {
        router.push("/researcher")
      } else {
        setError("Invalid OTP. Please try again.")
      }
    } catch (error) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen justify-center">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Researcher Login</CardTitle>
          <CardDescription className="text-center">
            Enter your phone number to access the researcher dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isOtpSent ? (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="otp">One-Time Password</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter OTP"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                disabled={isLoading}
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">
                For demo purposes, use any 6-digit number as OTP
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={isOtpSent ? handleLogin : handleSendOtp}
            disabled={isLoading}
          >
            {isLoading
              ? "Processing..."
              : isOtpSent
              ? "Login"
              : "Send OTP"}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-4 text-center">
        <Button variant="link" onClick={() => router.push("/login")}>
          Farmer Login
        </Button>
      </div>
    </div>
  )
}