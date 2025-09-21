"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { AuthGuard } from "@/components/auth-guard"
import { db, type CollectionEvent } from "@/lib/db"
import { authManager } from "@/lib/auth"
import { formatTimestamp } from "@/lib/utils"
import { format } from "date-fns"
import { MapPin, Calendar, Droplets, User, ArrowLeft, RefreshCw, Check, X } from "lucide-react"
import type { Metadata } from "next"

export default function EventDetailPage(props: { 
  params: Promise<{ eventId: string }> 
}) {
  const params = React.use(props.params);
  const router = useRouter()
  const [event, setEvent] = useState<CollectionEvent | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const events = await db.collectionEvents
          .where("eventId")
          .equals(params.eventId)
          .toArray()

        if (events.length === 0) {
          setError("Event not found")
          return
        }

        setEvent(events[0])
        
        // Get current researcher ID
        const researcherId = authManager.getUserId()
        
      } catch (err) {
        console.error("Failed to load event:", err)
        setError("Failed to load event details")
      } finally {
        setIsPageLoading(false)
      }
    }

    loadEvent()
  }, [params.eventId])

  const handleBack = () => router.back()

  const handleAssignToResearcher = async () => {
    if (!event?.id) return

    try {
      setIsAssigning(true)
      const researcherId = authManager.getUserId() || ''
      
      await db.collectionEvents.update(event.id, {
        researcherId,
        status: 'pending',
        updatedAt: formatTimestamp(new Date())
      })

      // Update local state
      setEvent({
        ...event,
        researcherId,
        status: 'pending'
      })
    } catch (err) {
      console.error("Failed to assign researcher:", err)
      setError("Failed to assign researcher")
      // Error handling already done with setError;
    } finally {
      setIsAssigning(false)
    }
  }

  if (isPageLoading) {
    return (
      <AuthGuard>
        <div className="container max-w-md mx-auto px-4 py-6 flex justify-center items-center min-h-[50vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthGuard>
    )
  }

  if (error || !event) {
    return (
      <AuthGuard>
        <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
          <Button variant="ghost" onClick={handleBack} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Alert variant="destructive">
            <AlertDescription>{error || "Event not found"}</AlertDescription>
          </Alert>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              event.status === "synced"
                ? "bg-green-100 text-green-800"
                : event.status === "failed"
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {event.status}
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{event.species}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Collector: {event.farmerId}</span>
              </div>

              {event.researcherId && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span>Assigned to: {event.researcherId}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Collected:{" "}
                  {event.timestamp ? format(new Date(event.timestamp), "PPp") : "N/A"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  Location:{" "}
                  {event.location
                    ? `${event.location.lat.toFixed(6)}, ${event.location.lon.toFixed(6)}`
                    : "N/A"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <span>
                  Moisture:{" "}
                  {event.quality?.moisturePct !== undefined
                    ? `${event.quality.moisturePct.toString()}%`
                    : "N/A"}
                </span>
              </div>
            </div>

            {event.quality?.notes && (
              <div>
                <h3 className="font-medium mb-1">Notes:</h3>
                <p className="text-sm text-muted-foreground">{event.quality.notes}</p>
              </div>
            )}

            <Separator />

            <div>
              <h3 className="font-medium mb-3">Photos ({event.photos?.length || 0}):</h3>
              {event.photos && event.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {event.photos.map((photo, index) => (
                    <Card key={photo.hash || index} className="overflow-hidden">
                      <img
                        src={photo.blobUrl}
                        alt={`${event.species} photo ${index + 1}`}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-2 space-y-1">
                        {photo.location ? (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Check className="h-3 w-3" />
                            <span>Geo-tagged</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <X className="h-3 w-3" />
                            <span>No location data</span>
                          </div>
                        )}
                        {photo.timestamp && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(photo.timestamp), "PPp")}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No photos available</p>
              )}
            </div>

            {!event.researcherId && (
              <Button
                onClick={handleAssignToResearcher}
                disabled={isAssigning}
                className="w-full mt-4"
              >
                {isAssigning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign to Me"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}
