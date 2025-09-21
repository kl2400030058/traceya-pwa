export interface LocationData {
  lat: number
  lon: number
  accuracy: number
  timestamp: string
}

export class GeolocationManager {
  private static instance: GeolocationManager
  private mockLocation: LocationData | null = null

  static getInstance(): GeolocationManager {
    if (!GeolocationManager.instance) {
      GeolocationManager.instance = new GeolocationManager()
    }
    return GeolocationManager.instance
  }
  
  // For testing and development environments
  setMockLocation(location: LocationData | null): void {
    this.mockLocation = location
    console.log('Mock location set:', this.mockLocation)
  }

  async getCurrentLocation(): Promise<LocationData> {
    // If mock location is set, return it immediately
    if (this.mockLocation) {
      console.log('Using mock location:', this.mockLocation)
      return this.mockLocation
    }
    
    return new Promise((resolve, reject) => {
      // Check if running in a secure context (HTTPS or localhost)
      console.log('Secure context check:', window.isSecureContext)
      if (!window.isSecureContext) {
        reject(new Error("Geolocation requires a secure context (HTTPS)"))
        return
      }
      
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"))
        return
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for slower connections
        maximumAge: 0, // Don't use cached position to ensure fresh data
      }

      console.log('Geolocation options:', options)
      console.log('Navigator geolocation available:', !!navigator.geolocation)
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Position received:', position)
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          let errorMessage = "Failed to get location"
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user"
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable"
              console.error('POSITION_UNAVAILABLE details:', {
                code: error.code,
                message: error.message,
                timestamp: new Date().toISOString(),
                secureContext: window.isSecureContext,
                userAgent: navigator.userAgent,
                platform: navigator.platform
              })
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out"
              break
          }
          console.error('Geolocation error message:', errorMessage)
          reject(new Error(errorMessage))
        },
        options,
      )
    })
  }

  async watchLocation(callback: (location: LocationData) => void): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"))
        return
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000,
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          callback({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          })
        },
        (error) => {
          console.error("Location watch error:", error)
        },
        options,
      )

      resolve(watchId)
    })
  }

  clearWatch(watchId: number): void {
    navigator.geolocation.clearWatch(watchId)
  }
}

export const geolocationManager = GeolocationManager.getInstance()
