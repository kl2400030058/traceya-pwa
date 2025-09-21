"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, Upload, X } from "lucide-react"
import { cameraManager, type PhotoData } from "@/lib/camera"

interface PhotoCaptureProps {
  onPhotoCapture: (photo: PhotoData) => void
  onPhotoRemove: (photo: PhotoData) => void
  photos: PhotoData[]
  maxPhotos?: number
}

export function PhotoCapture({ onPhotoCapture, onPhotoRemove, photos, maxPhotos = 3 }: PhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)

  const handleFileCapture = async () => {
    if (photos.length >= maxPhotos) return

    setIsCapturing(true)
    try {
      // Use captureFromCamera method instead of capturePhoto
      const photo = await cameraManager.captureFromCamera({
        type: "normal",
        intensity: 50
      })
      if (photo) {
        onPhotoCapture(photo)
      }
    } catch (error) {
      console.error("Photo capture failed:", error)
      alert("Failed to capture photo. Please try again.")
    } finally {
      setIsCapturing(false)
    }
  }

  const handleRemovePhoto = (photo: PhotoData) => {
    cameraManager.revokePhotoUrl(photo.blobUrl)
    onPhotoRemove(photo)
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <h3 className="text-base sm:text-lg font-medium">
          Photos ({photos.length}/{maxPhotos})
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFileCapture}
          disabled={isCapturing || photos.length >= maxPhotos}
          className="flex items-center gap-1.5 sm:gap-2 bg-transparent text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto"
        >
          {isCapturing ? <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          {isCapturing ? "Capturing..." : "Add Photo"}
        </Button>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          {photos.map((photo, index) => (
            <Card key={photo.hash} className="relative overflow-hidden">
              <img
                src={photo.blobUrl || "/placeholder.svg"}
                alt={`Herb photo ${index + 1}`}
                className="w-full aspect-square object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-1 sm:top-2 right-1 sm:right-2 h-5 w-5 sm:h-6 sm:w-6 p-0.5 sm:p-1"
                onClick={() => handleRemovePhoto(photo)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <Card className="border-dashed border-2 p-8 text-center">
          <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No photos added yet</p>
          <p className="text-sm text-muted-foreground mt-1">Tap "Add Photo" to capture herb images</p>
        </Card>
      )}
    </div>
  )
}
