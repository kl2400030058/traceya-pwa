"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Leaf, Smartphone, HelpCircle, User, Phone, Mail, Lock, ArrowRight } from "lucide-react"
import { authManager } from "@/lib/auth"
import { AuthGuard } from "@/components/auth-guard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateOTP, saveOTP, validateOTP } from "@/lib/otp"
import { savePendingRegistration, getPendingRegistrations, clearPendingRegistration } from "@/lib/localRegistration"

export default function LoginPage() {
  // Login state
  const [farmerId, setFarmerId] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("login")
  
  // Register state
  const [fullName, setFullName] = useState("")
  const [regFarmerId, setRegFarmerId] = useState("")
  const [regPhoneNumber, setRegPhoneNumber] = useState("")
  const [regError, setRegError] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  
  // Cached registration data for offline support
  const [pendingRegistrations, setPendingRegistrations] = useState<Array<{fullName: string, farmerId: string, phoneNumber: string}>>([])
  
  const router = useRouter()
  
  // Load any pending registrations from local storage
  useEffect(() => {
    try {
      const pendingRegs = getPendingRegistrations()
      setPendingRegistrations(pendingRegs.map((reg: {name: string, id: string, phone: string}) => ({
        fullName: reg.name,
        farmerId: reg.id,
        phoneNumber: reg.phone
      })))
    } catch (error) {
      console.error("Failed to load pending registrations:", error)
    }
  }, [])

  // Farmer ID login handler
  const handleFarmerIdLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!farmerId.trim()) {
      setError("Please enter your Farmer ID")
      setIsLoading(false)
      return
    }

    if (!otp.trim()) {
      setError("Please enter the OTP")
      setIsLoading(false)
      return
    }

    try {
      // Validate OTP first
      if (validateOTP(farmerId.trim(), otp.trim())) {
        const result = await authManager.login(farmerId.trim(), otp.trim())

        if (result.success) {
          // Check if MFA verification is required
          if (result.requiresMFA) {
            router.push(`/verify-mfa?redirectTo=${encodeURIComponent('/dashboard')}`)
          } else {
            router.push("/dashboard")
          }
        } else {
          setError("Login failed")
        }
      } else {
        setError("Invalid OTP. Please try again.")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Phone number login handler
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!phoneNumber.trim()) {
      setError("Please enter your phone number")
      setIsLoading(false)
      return
    }

    if (!otp.trim()) {
      setError("Please enter the OTP")
      setIsLoading(false)
      return
    }

    try {
      // Validate OTP first
      if (validateOTP(phoneNumber.trim(), otp.trim())) {
        // For demo purposes, we'll use the same login function
        // In production, this would be a separate API call
        const result = await authManager.login(phoneNumber.trim(), otp.trim())

        if (result.success) {
          // Check if MFA verification is required
          if (result.requiresMFA) {
            router.push(`/verify-mfa?redirectTo=${encodeURIComponent('/dashboard')}`)
          } else {
            router.push("/dashboard")
          }
        } else {
          setError("Login failed")
        }
      } else {
        setError("Invalid OTP. Please try again.")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Google login handler
  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      // Mock Google login - in production this would integrate with Firebase Auth
      setTimeout(async () => {
        const mockGoogleId = `google_${Date.now()}`
        const result = await authManager.login(mockGoogleId, "google_auth")
        
        if (result.success) {
          // Check if MFA verification is required
          if (result.requiresMFA) {
            router.push(`/verify-mfa?redirectTo=${encodeURIComponent('/dashboard')}`)
          } else {
            router.push("/dashboard")
          }
        } else {
          setError("Login failed")
          setIsLoading(false)
        }
      }, 1000)
    } catch (error) {
      setError("Google login failed")
      setIsLoading(false)
    }
  }

  // Registration handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRegistering(true)
    setRegError("")

    if (!fullName.trim()) {
      setRegError("Please enter your full name")
      setIsRegistering(false)
      return
    }

    if (!regFarmerId.trim()) {
      setRegError("Please enter your Farmer ID")
      setIsRegistering(false)
      return
    }

    if (!regPhoneNumber.trim()) {
      setRegError("Please enter your phone number")
      setIsRegistering(false)
      return
    }

    try {
      // Check if online
      if (navigator.onLine) {
        // Mock registration - in production this would call a real API
        // Simulate API call
        setTimeout(() => {
          // Switch to login tab after successful registration
          setActiveTab("login")
          setFarmerId(regFarmerId) // Pre-fill the login form
          setIsRegistering(false)
          alert("Registration successful! Please login with your credentials.")
        }, 1000)
      } else {
        // Store registration data for later sync using our utility
        savePendingRegistration({
          id: regFarmerId,
          name: fullName,
          phone: regPhoneNumber
        })
        
        // Update the UI with the new registration
        const newRegistration = { fullName, farmerId: regFarmerId, phoneNumber: regPhoneNumber }
        setPendingRegistrations([...pendingRegistrations, newRegistration])
        
        setActiveTab("login")
        setFarmerId(regFarmerId) // Pre-fill the login form
        alert("You're offline. Registration data saved and will be synced when online.")
        setIsRegistering(false)
      }
    } catch (error) {
      setRegError("Registration failed. Please try again.")
      setIsRegistering(false)
    }
  }

  const sendOTP = () => {
    const idToUse = activeTab === "login" ? farmerId : phoneNumber
    
    if (!idToUse.trim()) {
      setError("Please enter your ID or phone number first")
      return
    }

    // Generate and save OTP
    const newOtp = generateOTP()
    saveOTP(idToUse, newOtp)
    
    // Clear any previous errors
    setError("")
    
    // Show OTP for demo purposes (remove in production)
    alert(`OTP sent to registered mobile number. For demo, use: ${newOtp}`)
  }

  const showOnboarding = () => {
    // Clear onboarding completion flag to show tutorial again
    localStorage.removeItem("traceya_onboarding_completed")
    router.push("/onboarding")
  }

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-[95%] sm:max-w-md shadow-lg">
          <CardHeader className="text-center px-4 py-4 sm:px-6 sm:py-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary rounded-full">
                <Leaf className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-balance">Welcome to traceya</CardTitle>
            <CardDescription className="text-sm sm:text-base md:text-lg text-balance">Secure access for herb collection tracking</CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-[90%] mx-auto mb-4 sm:mb-6 h-10 sm:h-12">
              <TabsTrigger value="login" className="text-sm sm:text-base md:text-lg py-2 rounded-full">Login</TabsTrigger>
              <TabsTrigger value="register" className="text-sm sm:text-base md:text-lg py-2 rounded-full">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-0">
              <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-6">
                {/* Farmer ID Login */}
                <form onSubmit={handleFarmerIdLogin} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="farmerId" className="text-sm sm:text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Farmer ID
                    </Label>
                    <Input
                      id="farmerId"
                      type="text"
                      placeholder="Enter your Farmer ID"
                      value={farmerId}
                      onChange={(e) => setFarmerId(e.target.value)}
                      className="text-base sm:text-lg h-12 sm:h-14 rounded-full"
                      autoComplete="username"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="otp" className="text-sm sm:text-base flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        OTP
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={sendOTP}
                        className="text-primary hover:text-primary/80 text-xs sm:text-sm"
                        disabled={isLoading}
                      >
                        <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Send OTP
                      </Button>
                    </div>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="text-base sm:text-lg h-12 sm:h-14 text-center tracking-widest rounded-full"
                      maxLength={6}
                      autoComplete="one-time-code"
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive" className="py-2 text-sm sm:text-base">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 sm:h-14 text-base sm:text-lg bg-green-600 hover:bg-green-700 rounded-full"
                    disabled={isLoading || !farmerId.trim() || !otp.trim()}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
                
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-background text-muted-foreground">
                      OR
                    </span>
                  </div>
                </div>
                
                {/* Phone Number Login */}
                <form onSubmit={handlePhoneLogin} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm sm:text-base flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="text-base sm:text-lg h-12 sm:h-14 rounded-full"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="phoneOtp" className="text-sm sm:text-base flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        OTP
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={sendOTP}
                        className="text-primary hover:text-primary/80 text-xs sm:text-sm"
                        disabled={isLoading}
                      >
                        <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Send OTP
                      </Button>
                    </div>
                    <Input
                      id="phoneOtp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="text-base sm:text-lg h-12 sm:h-14 text-center tracking-widest rounded-full"
                      maxLength={6}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full h-12 sm:h-14 text-base sm:text-lg bg-green-600 hover:bg-green-700 rounded-full"
                    disabled={isLoading || !phoneNumber.trim() || !otp.trim()}
                  >
                    {isLoading ? "Signing in..." : "Sign In with Phone"}
                  </Button>
                </form>
                
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-background text-muted-foreground">
                      OR
                    </span>
                  </div>
                </div>
                
                {/* Google Login */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 sm:h-14 text-base sm:text-lg rounded-full flex items-center justify-center gap-2"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  Sign in with Google
                </Button>
                
                <div className="text-center text-sm text-muted-foreground mt-4">
                  <p className="text-balance">
                    For demo purposes, use OTP: <strong>123456</strong>
                    <br />
                    or the last 6 digits of your ID
                  </p>
                </div>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="register" className="mt-0">
              <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="fullName" className="text-sm sm:text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="text-base sm:text-lg h-12 sm:h-14 rounded-full"
                      disabled={isRegistering}
                    />
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="regFarmerId" className="text-sm sm:text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Farmer ID
                    </Label>
                    <Input
                      id="regFarmerId"
                      type="text"
                      placeholder="Enter your Farmer ID"
                      value={regFarmerId}
                      onChange={(e) => setRegFarmerId(e.target.value)}
                      className="text-base sm:text-lg h-12 sm:h-14 rounded-full"
                      disabled={isRegistering}
                    />
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="regPhoneNumber" className="text-sm sm:text-base flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="regPhoneNumber"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={regPhoneNumber}
                      onChange={(e) => setRegPhoneNumber(e.target.value)}
                      className="text-base sm:text-lg h-12 sm:h-14 rounded-full"
                      disabled={isRegistering}
                    />
                  </div>
                  
                  {regError && (
                    <Alert variant="destructive" className="py-2 text-sm sm:text-base">
                      <AlertDescription>{regError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button
                    type="submit"
                    className="w-full h-12 sm:h-14 text-base sm:text-lg bg-green-600 hover:bg-green-700 rounded-full mt-4"
                    disabled={isRegistering}
                  >
                    {isRegistering ? "Registering..." : "Register"}
                  </Button>
                </form>
                
                {pendingRegistrations.length > 0 && (
                  <div className="mt-6 p-3 sm:p-4 border border-yellow-300 bg-yellow-50 rounded-lg sm:rounded-xl">
                    <p className="text-xs sm:text-sm md:text-base text-yellow-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      You have {pendingRegistrations.length} pending registration{pendingRegistrations.length > 1 ? "s" : ""} that will be synced when you're online.
                    </p>
                  </div>
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
          
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
            <div className="space-y-2">
            <Button 
              onClick={showOnboarding} 
              variant="ghost" 
              className="w-full h-10 sm:h-12 text-xs sm:text-sm md:text-base rounded-full hover:bg-gray-100 transition-colors"
            >
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Show Tutorial
            </Button>
            
            <Button
              variant="ghost"
              className="w-full h-10 sm:h-12 text-xs sm:text-sm md:text-base rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => router.push("/researcher-login")}
            >
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Researcher Login
            </Button>
            
            <Button
              variant="ghost"
              className="w-full h-10 sm:h-12 text-xs sm:text-sm md:text-base rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => router.push("/lab-login")}
            >
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Lab & Processor Login
            </Button>
            
            <Button
              variant="ghost"
              className="w-full h-10 sm:h-12 text-xs sm:text-sm md:text-base rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => router.push("/admin-login")}
            >
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Admin Login
            </Button>
          </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}
