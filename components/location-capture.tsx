"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Loader2, RefreshCw, RefreshCcw } from "lucide-react"

import { geolocationManager, type LocationData } from "@/lib/geolocation"
import { formatLocation } from "@/lib/utils"

interface LocationCaptureProps {
  onLocationCapture: (location: LocationData) => void
  location: LocationData | null
  autoCapture?: boolean
}

export function LocationCapture({ onLocationCapture, location, autoCapture = true }: LocationCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (autoCapture && !location) {
      captureLocation()
    }
  }, [autoCapture, location])

  const captureLocation = async () => {
    setIsCapturing(true)
    setError(null)

    try {
      // Check if browser supports permissions API
      if (navigator.permissions && navigator.permissions.query) {
        try {
          console.log('Checking geolocation permission');
          console.log('Browser secure context:', window.isSecureContext);
          console.log('User agent:', navigator.userAgent);
          console.log('Permissions API available');
          
          const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
          console.log('Permission state:', result.state);
          
          if (result.state === 'denied') {
            throw new Error('Location permission denied. Please enable location access in your browser settings.')
          }
        } catch (permErr) {
          console.warn('Permission check failed:', permErr)
          // Continue anyway, the geolocation API will handle permission errors
        }
      } else {
        console.log('Permissions API not supported');
      }

      console.log('Attempting to get current location');
      const locationData = await geolocationManager.getCurrentLocation()
      onLocationCapture(locationData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get location"
      console.error('Location error details:', { message: errorMessage, error: err });
      setError(errorMessage)
      console.error('Location error:', err)
    } finally {
      setIsCapturing(false)
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy <= 10) return "text-green-600"
    if (accuracy <= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getAccuracyText = (accuracy: number) => {
    if (accuracy <= 10) return "Excellent"
    if (accuracy <= 50) return "Good"
    return "Poor"
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <h3 className="text-base sm:text-lg font-medium">Location</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={captureLocation}
          disabled={isCapturing}
          className="flex items-center gap-1.5 sm:gap-2 bg-transparent text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto"
        >
          {isCapturing ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          {isCapturing ? "Getting Location..." : "Refresh"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          {location ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">Location Captured</span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Coordinates: </span>
                  <span className="font-mono">{formatLocation(location.lat, location.lon)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Accuracy: </span>
                  <span className={`font-medium ${getAccuracyColor(location.accuracy)}`}>
                    ±{Math.round(location.accuracy)}m ({getAccuracyText(location.accuracy)})
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Captured: </span>
                  <span>{new Date(location.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <MapPin className="h-12 w-12 mx-auto text-red-500 mb-2" />
              <p className="text-red-600 font-medium">Location Error</p>
              <p className="text-sm text-muted-foreground mt-1">Geolocation error: {error}</p>
              <p className="text-xs text-muted-foreground mt-1 mb-2">Debug: {typeof window !== 'undefined' ? `Secure context: ${window.isSecureContext}` : 'Window not available'}</p>
              <div className="text-xs text-muted-foreground mt-1 mb-2">
                <p className="font-medium mb-1">Troubleshooting steps:</p>
                <ul className="list-disc list-inside">
                  <li>Check if location services are enabled on your device</li>
                  <li>Make sure you've granted location permission to this site</li>
                  <li>Try refreshing the page or using a different browser</li>
                  <li>If on mobile, ensure GPS is enabled and has a clear signal</li>
                  <li>If indoors, try moving closer to a window</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={captureLocation}
                  className="mt-3 bg-transparent"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" /> Try Again
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Use mock location for testing
                    const mockLocation = {
                      lat: 37.7749,
                      lon: -122.4194,
                      accuracy: 10,
                      timestamp: new Date().toISOString()
                    };
                    geolocationManager.setMockLocation(mockLocation);
                    captureLocation();
                  }}
                  className="mt-2 bg-transparent text-xs"
                >
                  Use Test Location
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-2" />
              <p className="text-muted-foreground">Getting your location...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}