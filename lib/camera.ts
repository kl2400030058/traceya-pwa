import { GeolocationManager, LocationData } from "./geolocation"
import { FilterSettings, VideoData } from "./types"

export interface PhotoData {
  blobUrl: string
  hash: string
  file: File
  timestamp?: string
  location?: LocationData
  plantId?: string
  collectorId?: string
  filterApplied?: string
  filterIntensity?: number
  qualityScore?: number
  lightCondition?: string
}

export class CameraManager {
  private static instance: CameraManager
  private availableFilters: string[] = ['normal', 'clarity', 'lowLight', 'vivid', 'monochrome', 'warm']

  private constructor() {}

  public static getInstance(): CameraManager {
    if (!CameraManager.instance) {
      CameraManager.instance = new CameraManager()
    }
    return CameraManager.instance
  }

  public async capturePhoto(constraints: MediaStreamConstraints, filterSettings?: FilterSettings): Promise<PhotoData> {
    // This method is now a wrapper around captureFromCamera for backward compatibility
    return this.captureFromCamera(filterSettings)
  }

  public async captureFromCamera(filterSettings?: FilterSettings): Promise<PhotoData> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      })
      const video = document.createElement("video")
      video.srcObject = stream
      await video.play()

      // Create a canvas element to capture the frame
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")

      // Draw the video frame to the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Apply filter if specified
      if (filterSettings) {
        this.applyFilter(ctx, canvas.width, canvas.height, filterSettings)
      }

      // Add GPS overlay if location is available
      const geolocationManager = GeolocationManager.getInstance()
      let location: LocationData | undefined

      try {
        location = await geolocationManager.getCurrentLocation()
        if (location) {
          this.addGPSOverlay(ctx, location, canvas.width, canvas.height)
        }
      } catch (error) {
        console.warn("Could not get location for photo:", error)
        // Continue without location
      }

      // Convert the canvas to a blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else throw new Error("Could not create blob from canvas")
        }, "image/jpeg", 0.9) // Higher quality JPEG
      })

      // Stop the video stream
      stream.getTracks().forEach((track) => track.stop())

      // Create a file from the blob
      const file = new File([blob], `photo-${Date.now()}.jpg`, {
        type: "image/jpeg",
      })

      const blobUrl = URL.createObjectURL(blob)
      const hash = await this.generateHash(file)

      // Calculate a basic quality score
      const qualityScore = this.calculatePhotoQuality(file)

      return {
        blobUrl,
        hash,
        file,
        timestamp: new Date().toISOString(),
        location,
        filterApplied: filterSettings?.type,
        filterIntensity: filterSettings?.intensity,
        qualityScore
      }
    } catch (error) {
      console.error("Error capturing from camera:", error)
      throw new Error("Failed to capture photo from camera: " + error)
    }
  }

  public async captureVideo(duration: number = 15): Promise<VideoData | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })
      
      const chunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      // Get location at the start of recording
      const geolocationManager = GeolocationManager.getInstance()
      let location: LocationData | undefined
      
      try {
        location = await geolocationManager.getCurrentLocation()
      } catch (error) {
        console.warn("Could not get location for video:", error)
      }
      
      return new Promise((resolve) => {
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'video/webm' })
          const file = new File([blob], `video-${Date.now()}.webm`, {
            type: 'video/webm'
          })
          
          const blobUrl = URL.createObjectURL(blob)
          const hash = await this.generateHash(file)
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop())
          
          resolve({
            blobUrl,
            hash,
            file,
            timestamp: new Date().toISOString(),
            duration,
            location
          })
        }
        
        // Start recording
        mediaRecorder.start()
        
        // Stop after specified duration
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop()
          }
        }, duration * 1000)
      })
    } catch (error) {
      console.error("Error capturing video:", error)
      return null
    }
  }
  
  public getAvailableFilters(): string[] {
    return [...this.availableFilters]
  }
  
  private async generateHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }
  
  public async generateFileHash(file: File): Promise<string> {
    return this.generateHash(file)
  }
  
  private calculatePhotoQuality(file: File): number {
    // Basic quality score based on file size
    // In a real app, this would analyze resolution, focus, lighting, etc.
    const fileSizeScore = Math.min(file.size / 1000000 * 20, 100) // 5MB would be 100%
    return Math.round(fileSizeScore)
  }
  
  private applyFilter(ctx: CanvasRenderingContext2D, width: number, height: number, filterSettings: FilterSettings): void {
    const { type, intensity } = filterSettings
    const normalizedIntensity = intensity / 100 // Convert 0-100 to 0-1
    
    switch (type) {
      case 'clarity':
        // Increase contrast and sharpness
        ctx.filter = `contrast(${100 + 50 * normalizedIntensity}%) saturate(${100 + 20 * normalizedIntensity}%)`
        ctx.drawImage(ctx.canvas, 0, 0)
        ctx.filter = 'none'
        break
        
      case 'lowLight':
        // Brighten dark areas while preserving highlights
        ctx.filter = `brightness(${100 + 50 * normalizedIntensity}%) contrast(${100 + 20 * normalizedIntensity}%)`
        ctx.drawImage(ctx.canvas, 0, 0)
        ctx.filter = 'none'
        break
        
      case 'vivid':
        // Increase saturation and contrast
        ctx.filter = `saturate(${100 + 100 * normalizedIntensity}%) contrast(${100 + 20 * normalizedIntensity}%)`
        ctx.drawImage(ctx.canvas, 0, 0)
        ctx.filter = 'none'
        break
        
      case 'monochrome':
        // Black and white with contrast
        ctx.filter = `grayscale(100%) contrast(${100 + 30 * normalizedIntensity}%)`
        ctx.drawImage(ctx.canvas, 0, 0)
        ctx.filter = 'none'
        break
        
      case 'warm':
        // Warm color temperature
        ctx.filter = `sepia(${50 * normalizedIntensity}%)`
        ctx.drawImage(ctx.canvas, 0, 0)
        ctx.filter = 'none'
        break
        
      default:
        // No filter
        break
    }
  }
  
  private addGPSOverlay(ctx: CanvasRenderingContext2D, location: LocationData, width: number, height: number): void {
    // Add a small GPS info overlay to the bottom of the image
    const { lat: latitude, lon: longitude, accuracy } = location
    
    // Create semi-transparent background for text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, height - 30, width, 30)
    
    // Add GPS text
    ctx.fillStyle = 'white'
    ctx.font = '14px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    
    const accuracyColor = accuracy < 10 ? '#4CAF50' : accuracy < 50 ? '#FFC107' : '#F44336'
    const gpsText = `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} | Accuracy: ${accuracy.toFixed(1)}m`
    
    ctx.fillText(gpsText, 10, height - 15)
    
    // Add accuracy indicator
    ctx.fillStyle = accuracyColor
    ctx.beginPath()
    ctx.arc(width - 15, height - 15, 8, 0, Math.PI * 2)
    ctx.fill()
  }

  revokePhotoUrl(blobUrl: string): void {
    URL.revokeObjectURL(blobUrl)
  }
}

export const cameraManager = CameraManager.getInstance()
