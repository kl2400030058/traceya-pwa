"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, MapPin, Upload, X, Video, Sun, Filter } from "lucide-react"
import { CameraManager, type PhotoData } from "@/lib/camera"
import { GeolocationManager, type LocationData } from "@/lib/geolocation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { VideoData, FilterSettings } from "@/lib/types"

interface EnhancedPhotoCaptureProps {
  onPhotoCapture: (photo: PhotoData) => void
  onVideoCapture?: (video: VideoData) => void
  onPhotoRemove: (photo: PhotoData) => void
  photos: PhotoData[]
  videos?: VideoData[]
  maxPhotos?: number
  maxVideos?: number
  collectorId?: string
  plantId?: string
}

const FILTERS = [
  { value: "normal", label: "No Filter" },
  { value: "clarity", label: "Clarity" },
  { value: "lowLight", label: "Low Light" },
  { value: "vivid", label: "Vivid" },
  { value: "monochrome", label: "Monochrome" },
  { value: "warm", label: "Warm" },
]

export function EnhancedPhotoCapture({ 
  onPhotoCapture, 
  onVideoCapture,
  onPhotoRemove, 
  photos, 
  videos = [],
  maxPhotos = 5,
  maxVideos = 2,
  collectorId,
  plantId
}: EnhancedPhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [locationError, setLocationError] = useState<string | null>('')
  const [activeFilter, setActiveFilter] = useState('normal')
  const [filterIntensity, setFilterIntensity] = useState(50)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showLivePreview, setShowLivePreview] = useState(false)
  const [activeTab, setActiveTab] = useState('photo')
  const [selectedFilter, setSelectedFilter] = useState('normal')
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  
  const cameraManager: CameraManager = CameraManager.getInstance()
  const geolocationManager: GeolocationManager = GeolocationManager.getInstance()
  const availableFilters = cameraManager.getAvailableFilters()

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [])
  
  const startCameraPreview = async () => {
    try {
      setIsCapturing(true)
      setLocationError('')
      
      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (error) {
      console.error('Error starting camera preview:', error)
      setIsCapturing(false)
      setLocationError('Could not access camera')
    }
  }
  
  const stopCameraPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    setIsCapturing(false)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }
  
  const capturePhoto = async () => {
    if (!streamRef.current) return
    
    // Apply selected filter
    const filterSettings: FilterSettings = {
      type: activeFilter,
      intensity: filterIntensity
    }
    
    try {
      // Use the new captureFromCamera method
      const photoData = await cameraManager.captureFromCamera(filterSettings)
      
      // Add collector and plant IDs
      if (collectorId) photoData.collectorId = collectorId
      if (plantId) photoData.plantId = plantId
      
      // Call the onPhotoCapture callback
      onPhotoCapture(photoData)
      
      // Stop camera preview
      stopCameraPreview()
    } catch (error) {
      console.error('Error capturing photo:', error)
      setLocationError('Failed to capture photo')
    }
  }
      const startVideoRecording = async () => {
    if (!onVideoCapture) return
    if (!videoRef.current || !streamRef.current) return
    
    try {
      // Need to get a new stream with audio
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          // Auto-stop at 15 seconds
          if (prev >= 15) {
            stopVideoRecording()
            return 15
          }
          return prev + 1
        })
      }, 1000)
      
      // Start actual recording using CameraManager
      const videoData = await cameraManager.captureVideo(15)
      
      if (videoData && onVideoCapture) {
        onVideoCapture(videoData)
      }
      
      stopVideoRecording()
    } catch (error) {
      console.error('Error recording video:', error)
      setLocationError('Failed to record video')
      setIsRecording(false)
    }
  }
  
  const stopVideoRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    
    setIsRecording(false)
    setRecordingTime(0)
    
    // Restart normal camera preview
    startCameraPreview()
  }
  
  const handleFileCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      setLocationError('')
      
      // Create filter settings
      const filterSettings: FilterSettings = {
        type: activeFilter,
        intensity: filterIntensity
      }
      
      // Use CameraManager to process the file with the updated method
      const photo = await cameraManager.captureFromCamera(filterSettings)
      
      // Add collector and plant IDs
      if (collectorId) photo.collectorId = collectorId
      if (plantId) photo.plantId = plantId
      
      onPhotoCapture(photo)
    } catch (error) {
      console.error('Error capturing from file:', error)
      setLocationError('Failed to process photo')
    } finally {
      // Reset the input
      event.target.value = ''
    }
  }
  
  // Simple hash function for demo purposes
  const generateSimpleHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
      
      return (
    <div className="space-y-4">
      {isCapturing ? (
        <div className="relative rounded-lg overflow-hidden bg-black">
          {/* Camera preview */}
          <video
            ref={videoRef}
            className="w-full h-auto"
            playsInline
            muted
          />
          
          {/* Canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Filter controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {availableFilters.map(filter => (
                  <Button
                    key={filter}
                    variant={filter === activeFilter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                    className="whitespace-nowrap"
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            
            {activeFilter !== 'normal' && (
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm">Intensity:</span>
                <Slider
                  value={[filterIntensity]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(values) => setFilterIntensity(values[0])}
                  className="flex-1"
                />
                <span className="text-white text-sm">{filterIntensity}%</span>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="absolute top-2 right-2 space-x-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={stopCameraPreview}
            >
              Cancel
            </Button>
          </div>
          
          {/* Capture buttons */}
          <div className="absolute bottom-24 left-0 right-0 flex justify-center space-x-4">
            {isRecording ? (
              <div className="flex flex-col items-center">
                <Button
                  variant="destructive"
                  size="lg"
                  className="rounded-full w-16 h-16 flex items-center justify-center"
                  onClick={stopVideoRecording}
                >
                  <span className="text-lg">{15 - recordingTime}s</span>
                </Button>
                <span className="text-white text-sm mt-1">Recording...</span>
              </div>
            ) : (
              <>
                <Button
                  variant="default"
                  size="lg"
                  className="rounded-full w-16 h-16 flex items-center justify-center"
                  onClick={capturePhoto}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                </Button>
                
                {onVideoCapture && videos.length < (maxVideos || 2) && (
                  <Button
                    variant="secondary"
                    size="lg"
                    className="rounded-full w-16 h-16 flex items-center justify-center"
                    onClick={startVideoRecording}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  </Button>
                )}
              </>
            )}
          </div>
          
          {/* Location error message */}
          {locationError && (
            <div className="absolute top-2 left-2 right-16 bg-yellow-600/80 text-white text-sm p-2 rounded">
              {locationError}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={startCameraPreview}
              disabled={photos.length >= maxPhotos}
              variant="outline"
              className="flex-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              Camera
            </Button>
            
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileCapture}
                disabled={photos.length >= maxPhotos}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={photos.length >= maxPhotos}
                asChild
              >
                <span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Gallery
                </span>
              </Button>
            </label>
            
            {onVideoCapture && (
              <Button
                onClick={startVideoRecording}
                disabled={videos.length >= (maxVideos || 2)}
                variant="outline"
                className="flex-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                Video
              </Button>
            )}
          </div>
          
          {/* Media display */}
          <Tabs defaultValue="photos" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="photos">
                Photos ({photos.length}/{maxPhotos})
              </TabsTrigger>
              {onVideoCapture && (
                <TabsTrigger value="videos">
                  Videos ({videos.length}/{maxVideos || 2})
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="photos" className="mt-2">
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={photo.hash} className="relative rounded-md overflow-hidden aspect-square">
                      <img
                        src={photo.blobUrl}
                        alt={`Captured photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Filter badge */}
                      {photo.filterApplied && (
                        <Badge className="absolute top-1 left-1 bg-black/70 text-white text-xs">
                          {photo.filterApplied}
                        </Badge>
                      )}
                      
                      {/* GPS indicator */}
                      {photo.location && (
                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {photo.location.accuracy < 10 ? 'High' : photo.location.accuracy < 50 ? 'Medium' : 'Low'}
                        </div>
                      )}
                      
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full"
                        onClick={() => onPhotoRemove(photo)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No photos captured yet
                </div>
              )}
            </TabsContent>
            
            {onVideoCapture && (
              <TabsContent value="videos" className="mt-2">
                {videos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {videos.map((video, index) => (
                      <div key={video.hash} className="relative rounded-md overflow-hidden aspect-video">
                        <video
                          src={video.blobUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Duration badge */}
                        <Badge className="absolute top-1 left-1 bg-black/70 text-white text-xs">
                          {video.duration}s
                        </Badge>
                        
                        {/* GPS indicator */}
                        {video.location && (
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            GPS
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No videos recorded yet
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </div>
  );
  
  // Function to add GPS overlay to canvas
  const addGPSOverlay = (ctx: CanvasRenderingContext2D, currentLocation: LocationData | null, canvas: HTMLCanvasElement) => {
    if (currentLocation) {
      ctx.fillStyle = 'white';
      ctx.fillText(
        `GPS: ${currentLocation.lat.toFixed(6)}, ${currentLocation.lon.toFixed(6)}`, 
        15, 
        canvas.height - 20
      );
    }
  };
  
  // Handle tab change
  useEffect(() => {
    if (showLivePreview) {
      stopCameraPreview()
      startCameraPreview()
    }
  }, [activeTab])
  
  // Start/stop preview based on showLivePreview state
  useEffect(() => {
    if (showLivePreview) {
      startCameraPreview()
    } else {
      stopCameraPreview()
    }
    
    return () => {
      stopCameraPreview()
    }
  }, [showLivePreview, activeTab])

  const handlePhotoCapture = async () => {
    if (photos.length >= maxPhotos) return
    
    if (showLivePreview && canvasRef.current) {
      // Capture from live preview with filters applied
      setIsCapturing(true)
      
      try {
        const canvas = canvasRef.current
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9)
        })
        
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
        const blobUrl = URL.createObjectURL(blob)
        const hash = await cameraManager.generateFileHash(file)
        
        const photoData: PhotoData = {
          blobUrl,
          hash,
          file,
          timestamp: new Date().toISOString(),
          location: currentLocation || undefined,
          collectorId,
          plantId,
          lightCondition: activeFilter === "lowLight" ? "low-light" : "normal",
          filterApplied: activeFilter !== "normal" ? activeFilter : undefined
        }
        
        onPhotoCapture(photoData)
      } catch (err) {
        console.error("Error capturing from canvas:", err)
        alert("Failed to capture photo. Please try again.")
      } finally {
        setIsCapturing(false)
      }
    } else {
      // Fallback to regular photo capture
      setIsCapturing(true)
      setLocationError(null)
      
      try {
        // Capture photo first
        const photo = await cameraManager.capturePhoto({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        }, {
          type: activeFilter,
          intensity: filterIntensity
        })
        
        // Then get current location
        try {
          const location = await geolocationManager.getCurrentLocation()
          
          // Attach location data to the photo
          const photoWithLocation: PhotoData = {
            ...photo,
            location: {
              lat: location.lat,
              lon: location.lon,
              accuracy: location.accuracy,
              timestamp: location.timestamp
            },
            collectorId,
            plantId
          }
          
          onPhotoCapture(photoWithLocation)
        } catch (locationError) {
          console.error("Location capture failed:", locationError)
          setLocationError("Could not attach location data to photo")
          
          // Still provide the photo without location
          onPhotoCapture({
            ...photo,
            timestamp: new Date().toISOString(),
            collectorId,
            plantId
          })
        }
      } catch (error) {
        console.error("Photo capture failed:", error)
        alert("Failed to capture photo. Please try again.")
      } finally {
        setIsCapturing(false)
      }
    }
  }

  const handleVideoCapture = () => {
    if (!mediaRecorderRef.current || !showLivePreview) return
    
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    } else {
      // Start recording (15 seconds max)
      recordedChunksRef.current = []
      mediaRecorderRef.current.start()
      setIsRecording(true)
      
      // Auto-stop after 15 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop()
          setIsRecording(false)
        }
      }, 15000)
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
          Photos & Videos ({photos.length}/{maxPhotos})
        </h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className="flex items-center gap-1.5 sm:gap-2 bg-transparent text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto"
          >
            <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {showLivePreview ? "Hide Preview" : "Show Preview"}
          </Button>
        </div>
      </div>

      {locationError && (
        <div className="text-sm text-amber-600 flex items-center gap-1 mt-1">
          <MapPin className="h-3.5 w-3.5" />
          <span>{locationError}</span>
        </div>
      )}
      
      {showLivePreview && (
        <Card className="overflow-hidden">
          <div className="relative">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center p-2 bg-muted/50">
                <TabsList>
                  <TabsTrigger value="photo" className="text-xs sm:text-sm">
                    <Camera className="h-3.5 w-3.5 mr-1" />
                    Photo
                  </TabsTrigger>
                  <TabsTrigger value="video" className="text-xs sm:text-sm">
                    <Video className="h-3.5 w-3.5 mr-1" />
                    Video
                  </TabsTrigger>
                </TabsList>
                
                {activeTab === "photo" && (
                  <div className="flex items-center gap-2">
                    <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <Filter className="h-3 w-3 mr-1" />
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        {FILTERS.map(filter => (
                          <SelectItem key={filter.value} value={filter.value}>
                            {filter.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedFilter !== "none" && (
                      <div className="w-24 flex items-center gap-1">
                        <Sun className="h-3 w-3" />
                        <Slider
                          value={[filterIntensity]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(vals) => setFilterIntensity(vals[0])}
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <TabsContent value="photo" className="m-0">
                <div className="relative aspect-video bg-black">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover z-10 hidden"
                  />
                  <canvas 
                    ref={canvasRef} 
                    className="absolute inset-0 w-full h-full object-cover z-20"
                  />
                  <div className="absolute bottom-3 right-3 z-30">
                    <Button 
                      size="sm" 
                      onClick={handlePhotoCapture}
                      disabled={isCapturing || photos.length >= maxPhotos}
                      className="rounded-full h-12 w-12 p-0"
                    >
                      {isCapturing ? (
                        <Upload className="h-5 w-5 animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="video" className="m-0">
                <div className="relative aspect-video bg-black">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 right-3 z-30">
                    <Button 
                      size="sm" 
                      onClick={handleVideoCapture}
                      variant={isRecording ? "destructive" : "default"}
                      className="rounded-full h-12 w-12 p-0"
                    >
                      {isRecording ? (
                        <span className="h-5 w-5 rounded-full bg-red-500 animate-pulse" />
                      ) : (
                        <Video className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  {isRecording && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      Recording (15s max)
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          {photos.map((photo, index) => (
            <Card key={photo.hash} className="relative overflow-hidden">
              <img
                src={photo.blobUrl || "/placeholder.svg"}
                alt={`Herb photo ${index + 1}`}
                className="w-full aspect-square object-cover"
              />
              <div className="absolute bottom-1 left-1 flex flex-col gap-1">
                {photo.location && (
                  <div className="bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>Geo-tagged</span>
                  </div>
                )}
                {photo.filterApplied && (
                  <div className="bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                    <Filter className="h-3 w-3" />
                    <span>{photo.filterApplied}</span>
                  </div>
                )}
              </div>
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

      {photos.length === 0 && !showLivePreview && (
        <Card className="border-dashed border-2 p-8 text-center">
          <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No photos added yet</p>
          <p className="text-sm text-muted-foreground mt-1">Tap "Show Preview" to use enhanced camera features</p>
        </Card>
      )}
    </div>
  )
}