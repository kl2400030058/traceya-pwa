"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/auth-guard"
import { EnhancedPhotoCapture } from "@/components/enhanced-photo-capture"
import { LocationCapture } from "@/components/location-capture"
import { EnvironmentalConditions, type EnvironmentalConditionsData } from "@/components/environmental-conditions"
import { PlantMetadata, type PlantMetadataData } from "@/components/plant-metadata"
import { ActivityLog, CollectionChecklist, type ActivityLogEntry } from "@/components/activity-log"
import { db, type CollectionEvent } from "@/lib/db"
import { authManager } from "@/lib/auth"
import { smsManager } from "@/lib/sms"
import { syncManager } from "@/lib/sync"
import { generateEventId, formatTimestamp } from "@/lib/utils"
import { ayurvedicSpecies } from "@/lib/species"
import type { PhotoData } from "@/lib/camera"
import type { LocationData } from "@/lib/geolocation"

export default function CapturePage() {
  const router = useRouter()
  const [species, setSpecies] = useState("")
  const [moisturePct, setMoisturePct] = useState("")
  const [notes, setNotes] = useState("")
  const [photos, setPhotos] = useState<PhotoData[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("basic")
  const [environmentalConditions, setEnvironmentalConditions] = useState<EnvironmentalConditionsData>({})
  const [plantMetadata, setPlantMetadata] = useState<PlantMetadataData>({})
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([])
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [qualityScore, setQualityScore] = useState(0)

  // State for detailed quality metrics
  const [qualityMetrics, setQualityMetrics] = useState({
    gpsAccuracy: 0,
    photoQuality: 0,
    metadataCompleteness: 0,
    environmentalData: 0,
    plantData: 0
  })
  const [qualitySuggestions, setQualitySuggestions] = useState<string[]>([])

  // Effect to log activities and update checklist
  useEffect(() => {
    // Update checklist based on form state
    const newCompletedSteps = []
    if (species) newCompletedSteps.push("species")
    if (Object.keys(plantMetadata).length > 0) newCompletedSteps.push("metadata")
    if (Object.keys(environmentalConditions).length > 0) newCompletedSteps.push("environmental")
    if (location) newCompletedSteps.push("location")
    if (photos.length > 0) newCompletedSteps.push("photos")
    if (notes.trim()) newCompletedSteps.push("notes")
    
    setCompletedSteps(newCompletedSteps)
    
    // Calculate detailed quality metrics
    const metrics = {
      gpsAccuracy: location ? Math.min(100, Math.max(0, 100 - location.accuracy * 5)) : 0,
      photoQuality: Math.min(100, photos.length * 33),
      metadataCompleteness: species ? 100 : 0,
      environmentalData: Math.min(100, Object.keys(environmentalConditions).length * 20),
      plantData: Math.min(100, Object.keys(plantMetadata).length * 20)
    }
    
    setQualityMetrics(metrics)
    
    // Calculate overall quality score (weighted average)
    let score = 0
    score += species ? 20 : 0
    score += location ? 20 : 0
    score += photos.length > 0 ? 20 : 0
    score += Object.keys(environmentalConditions).length > 0 ? 15 : 0
    score += Object.keys(plantMetadata).length > 0 ? 15 : 0
    score += notes.trim() ? 10 : 0
    
    setQualityScore(score)
    
    // Generate quality improvement suggestions
    const suggestions: string[] = []
    
    if (!species) {
      suggestions.push("Select a species to improve data quality")
    }
    
    if (!location) {
      suggestions.push("Capture location data for better traceability")
    } else if (location.accuracy > 10) {
      suggestions.push("Try to get better GPS accuracy by moving to an open area")
    }
    
    if (photos.length === 0) {
      suggestions.push("Add at least one photo of the plant")
    } else if (photos.length < 3) {
      suggestions.push("Add more photos from different angles for better documentation")
    }
    
    if (Object.keys(environmentalConditions).length < 3) {
      suggestions.push("Add more environmental data for better context")
    }
    
    if (Object.keys(plantMetadata).length < 3) {
      suggestions.push("Add more plant metadata for better identification")
    }
    
    if (!notes.trim()) {
      suggestions.push("Add notes with your observations for better context")
    }
    
    setQualitySuggestions(suggestions)
  }, [species, location, photos, environmentalConditions, plantMetadata, notes])

  const handlePhotoCapture = (photo: PhotoData) => {
    setPhotos((prev) => [...prev, photo])
    
    // Log activity
    const newLog: ActivityLogEntry = {
      action: "Photo Captured",
      timestamp: new Date().toISOString(),
      details: `Photo with ${photo.location ? 'GPS data' : 'no GPS data'}`
    }
    
    setActivityLog((prev) => [newLog, ...prev])
  }

  const handleVideoCapture = (video: any) => {
    setVideos((prev) => [...prev, video])
    
    // Log activity
    const newLog: ActivityLogEntry = {
      action: "Video Captured",
      timestamp: new Date().toISOString(),
      details: `${video.duration}s video with ${video.location ? 'GPS data' : 'no GPS data'}`
    }
    
    setActivityLog((prev) => [newLog, ...prev])
  }

  const handlePhotoRemove = (photoToRemove: PhotoData) => {
    setPhotos((prev) => prev.filter((photo) => photo !== photoToRemove))
  }

  const handleLocationCapture = (locationData: LocationData) => {
    setLocation(locationData)
    
    // Log activity
    const newLog: ActivityLogEntry = {
      action: "Location Updated",
      timestamp: new Date().toISOString(),
      details: `GPS accuracy: ${locationData.accuracy.toFixed(1)}m`
    }
    
    setActivityLog((prev) => [newLog, ...prev])
  }
  
  const handleChecklistUpdate = (completed: string[]) => {
    setCompletedSteps(completed)
  }

  const validateForm = (): string | null => {
    if (!species) return "Please select a species"
    if (!moisturePct || isNaN(Number(moisturePct))) return "Please enter a valid moisture percentage"
    if (!location) return "Location is required"
    if (photos.length === 0) return "At least one photo is required"
    return null
  }

  const createCollectionEvent = (): CollectionEvent => {
    // Ensure authManager is only accessed on the client side
    const farmerId = typeof window !== 'undefined' ? authManager.getFarmerId() : null
    if (!farmerId) throw new Error("Farmer ID not available")
    const now = new Date()
    
    // Create a new activity log entry for saving
    const saveLog: ActivityLogEntry = {
      action: "Collection Saved",
      timestamp: formatTimestamp(now),
      details: `${species} collection with ${photos.length} photos and ${videos.length} videos`
    }
    
    // Combine existing logs with the save log
    const updatedLogs = [saveLog, ...activityLog]
    
    return {
      eventId: generateEventId(),
      farmerId,
      species,
      location: {
        lat: location!.lat,
        lon: location!.lon,
        accuracy: location!.accuracy,
      },
      timestamp: formatTimestamp(now),
      photos: photos.map((photo) => ({
        blobUrl: photo.blobUrl,
        hash: photo.hash,
        location: photo.location,
        timestamp: photo.timestamp || formatTimestamp(now)
      })),
      videos: videos,
      environmentalConditions,
      plantMetadata,
      activityLog: updatedLogs,
      // completedSteps is tracked in state but not stored in CollectionEvent
      quality: {
        moisturePct: Number(moisturePct),
        notes: notes.trim(),
        score: qualityScore,
        metrics: qualityMetrics,
        suggestions: qualitySuggestions
      },
      status: "pending",
      onChainTx: null,
      lastError: null,
      createdAt: formatTimestamp(now),
      updatedAt: formatTimestamp(now),
      syncAttempts: 0
      // errors removed as it's not in the CollectionEvent interface
    }
  }

  // Second validateForm function removed to fix duplicate definition error

  const handleSaveOffline = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const event = createCollectionEvent()
      await db.collectionEvents.add(event)
      
      // Add to sync queue for automatic retry when online
      await syncManager.addToSyncQueue(event)
      
      // Log activity
      const newLog: ActivityLogEntry = {
        action: "Saved Offline",
        timestamp: new Date().toISOString(),
        details: `Added to sync queue for automatic retry`
      }
      
      // Clear form
      setSpecies("")
      setMoisturePct("")
      setNotes("")
      setPhotos([])
      setVideos([])
      setLocation(null)
      setEnvironmentalConditions({})
      setPlantMetadata({})
      setActivityLog([newLog, ...activityLog])

      router.push("/dashboard")
    } catch (error) {
      console.error("Error saving offline:", error)
      setError("Failed to save collection event")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncNow = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const event = createCollectionEvent()
      event.status = "pending"
      const savedEvent = await db.collectionEvents.add(event)

      // Log activity
      const syncLog: ActivityLogEntry = {
        action: "Sync Initiated",
        timestamp: new Date().toISOString(),
        details: "Attempting to sync with blockchain"
      }
      
      setActivityLog([syncLog, ...activityLog])
      
      // Use syncManager to handle the sync process
      const syncResult = await syncManager.syncData()
      
      if (syncResult.success) {
        // Clear form after successful sync
        setSpecies("")
        setMoisturePct("")
        setNotes("")
        setPhotos([])
        setVideos([])
        setLocation(null)
        setEnvironmentalConditions({})
        setPlantMetadata({})
        
        router.push("/dashboard")
      } else {
        // Sync failed but data is saved for later retry
        setError("Failed to sync. Data saved offline for later retry.")
      }
    } catch (error) {
      console.error("Error syncing:", error)
      setError("Failed to sync collection event")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendSMS = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const event = createCollectionEvent()
      await db.collectionEvents.add(event)

      // Get SMS gateway from settings
      const settings = await db.settings.toArray()
      const gatewayNumber = settings[0]?.smsGateway || "+1234567890"

      // Log activity
      const smsLog: ActivityLogEntry = {
        action: "SMS Sending",
        timestamp: new Date().toISOString(),
        details: `Sending collection data to ${gatewayNumber}`
      }
      
      setActivityLog([smsLog, ...activityLog])
      
      await smsManager.sendViaSMS(event, gatewayNumber)
      
      // Clear form after successful SMS
      setSpecies("")
      setMoisturePct("")
      setNotes("")
      setPhotos([])
      setVideos([])
      setLocation(null)
      setEnvironmentalConditions({})
      setPlantMetadata({})
    } catch (error) {
      console.error("Error sending SMS:", error)
      setError("Failed to send SMS")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-3 sm:p-4 max-w-2xl">
          <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 sm:h-4 sm:w-4"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold">Capture Collection</h1>
          </div>

          <Card>
            <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
              <CardTitle className="text-lg sm:text-xl">New Herb Collection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="species" className="text-sm sm:text-base">Species *</Label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                    <SelectValue placeholder="Select herb species" />
                  </SelectTrigger>
                  <SelectContent>
                    {ayurvedicSpecies.map((item) => (
                      <SelectItem key={item.value} value={item.value} className="text-sm sm:text-base">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="moisture" className="text-sm sm:text-base">Moisture Percentage *</Label>
                <Input
                  id="moisture"
                  type="number"
                  placeholder="Enter moisture %"
                  value={moisturePct}
                  onChange={(e) => setMoisturePct(e.target.value)}
                  className="h-9 sm:h-10 text-sm sm:text-base"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="notes" className="text-sm sm:text-base">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional observations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px] text-sm sm:text-base"
                  rows={3}
                />
              </div>

              {/* Quality Assessment Display */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Quality Score</h3>
                  <div className="flex items-center">
                    <span className="mr-2 text-sm font-medium">{qualityScore}/100</span>
                    <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${qualityScore >= 80 ? 'bg-green-500' : qualityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${qualityScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span>GPS Accuracy:</span>
                    <div className="flex items-center">
                      <span className="mr-1">{qualityMetrics.gpsAccuracy}%</span>
                      <div className="h-1.5 w-12 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${qualityMetrics.gpsAccuracy}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Photo Quality:</span>
                    <div className="flex items-center">
                      <span className="mr-1">{qualityMetrics.photoQuality}%</span>
                      <div className="h-1.5 w-12 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${qualityMetrics.photoQuality}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Metadata:</span>
                    <div className="flex items-center">
                      <span className="mr-1">{qualityMetrics.metadataCompleteness}%</span>
                      <div className="h-1.5 w-12 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${qualityMetrics.metadataCompleteness}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Environmental:</span>
                    <div className="flex items-center">
                      <span className="mr-1">{qualityMetrics.environmentalData}%</span>
                      <div className="h-1.5 w-12 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${qualityMetrics.environmentalData}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {qualitySuggestions.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-xs font-medium mb-1">Suggestions to improve quality:</h4>
                    <ul className="text-xs space-y-1">
                      {qualitySuggestions.slice(0, 3).map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <LocationCapture onLocationCapture={handleLocationCapture} location={location} autoCapture={true} />

              <EnhancedPhotoCapture
                onPhotoCapture={handlePhotoCapture}
                onPhotoRemove={handlePhotoRemove}
                photos={photos}
                maxPhotos={3}
                collectorId={typeof window !== 'undefined' ? authManager?.getFarmerId() || undefined : undefined}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2 sm:gap-3">
                <Button onClick={handleSaveOffline} disabled={isLoading} className="h-10 sm:h-12 text-base sm:text-lg" variant="default">
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
  className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
>
  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
  <polyline points="17 21 17 13 7 13 7 21" />
  <polyline points="7 3 7 8 15 8" />
</svg>
                  Save Offline
                  {!navigator.onLine && (
                    <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                      Auto-Queue
                    </Badge>
                  )}
                </Button>

                <Button onClick={handleSyncNow} disabled={isLoading || !navigator.onLine} className="h-10 sm:h-12 text-base sm:text-lg" variant="secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  Sync Now
                  {!navigator.onLine && (
                    <Badge variant="outline" className="ml-2 bg-red-100 text-red-800 border-red-300">
                      Offline
                    </Badge>
                  )}
                </Button>

                <Button
                  onClick={handleSendSMS}
                  disabled={isLoading}
                  className="h-10 sm:h-12 text-base sm:text-lg"
                  variant="outline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  SMS Fallback
                  <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 border-blue-300">
                    Blockchain
                  </Badge>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
