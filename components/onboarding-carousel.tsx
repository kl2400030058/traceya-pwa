"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Leaf, MapPin, Smartphone } from "lucide-react"

interface OnboardingStep {
  title: string
  description: string
  icon: React.ReactNode
  image?: string
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: "Welcome to traceya",
    description:
      "Track your Ayurvedic herb collections with GPS precision and offline capabilities. Perfect for farmers in remote areas.",
    icon: <Leaf className="h-12 w-12 text-primary" />,
  },
  {
    title: "Capture with GPS",
    description:
      "Automatically capture your location when collecting herbs. Works even in areas with poor network coverage.",
    icon: <MapPin className="h-12 w-12 text-primary" />,
  },
  {
    title: "Offline & SMS Backup",
    description: "Save collections offline and sync when connected. Use SMS as backup when internet is unavailable.",
    icon: <Smartphone className="h-12 w-12 text-primary" />,
  },
]

interface OnboardingCarouselProps {
  onComplete: () => void
}

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const [currentStep, setCurrentStep] = useState(0)
  
  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false)
  
  // Set mobile state on component mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkMobile()
    
    // Add resize listener
    window.addEventListener('resize', checkMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  const currentStepData = onboardingSteps[currentStep]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className={`w-full ${isMobile ? 'max-w-[95%]' : 'max-w-md'}`}>
        <CardContent className={`${isMobile ? 'p-6' : 'p-8'}`}>
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">{currentStepData.icon}</div>

            {/* Content */}
            <div className="space-y-4">
              <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-balance`}>{currentStepData.title}</h2>
              <p className="text-muted-foreground text-balance leading-relaxed text-sm sm:text-base">{currentStepData.description}</p>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2">
              {onboardingSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep ? "bg-primary" : index < currentStep ? "bg-primary/50" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
                size={isMobile ? "sm" : "default"}
              >
                <ChevronLeft className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                {isMobile ? "Back" : "Previous"}
              </Button>

              <span className="text-sm text-muted-foreground">
                {currentStep + 1} of {onboardingSteps.length}
              </span>

              <Button 
                onClick={nextStep} 
                className="flex items-center gap-2"
                size={isMobile ? "sm" : "default"}
              >
                {currentStep === onboardingSteps.length - 1 ? (
                  "Get Started"
                ) : (
                  <>
                    Next
                    <ChevronRight className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  </>
                )}
              </Button>
            </div>

            {/* Skip Option */}
            {currentStep < onboardingSteps.length - 1 && (
              <Button variant="ghost" onClick={onComplete} className="text-sm text-muted-foreground">
                Skip Tutorial
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
