"use client"
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MapPin, Calendar, Droplets, Camera, RotateCcw, Trash2, MessageSquare } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { StatusBadge } from "@/components/status-badge"
import { db, type CollectionEvent } from "@/lib/db"
import { smsManager } from "@/lib/sms"
import { getSpeciesLabel } from "@/lib/species"
import { formatLocation } from "@/lib/utils"

export default function EventDetailPage(props: { 
  params: Promise<{ eventId: string }> 
}) {
  const params = React.use(props.params);
  const router = useRouter()
  const [event, setEvent] = useState<CollectionEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadEvent()
  }, [params.eventId])

  const loadEvent = async () => {
    setIsLoading(true)
    try {
      const foundEvent = await db.collectionEvents.where("eventId").equals(params.eventId).first()

      setEvent(foundEvent || null)
    } catch (error) {
      console.error("Failed to load event:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = async () => {
    if (!event) return

    try {
      await db.collectionEvents.update(event.id!, {
        status: "uploading",
        lastError: null,
        updatedAt: new Date().toISOString(),
      })

      // Simulate sync attempt
      setTimeout(async () => {
        const success = Math.random() > 0.3 // 70% success rate
        await db.collectionEvents.update(event.id!, {
          status: success ? "synced" : "failed",
          lastError: success ? null : "Network timeout",
          updatedAt: new Date().toISOString(),
        })
        loadEvent()
      }, 2000)

      loadEvent()
    } catch (error) {
      console.error("Failed to retry event:", error)
    }
  }

  const handleDelete = async () => {
    if (!event) return

    if (confirm("Are you sure you want to delete this collection event?")) {
      try {
        await db.collectionEvents.delete(event.id!)
        router.push("/dashboard")
      } catch (error) {
        console.error("Failed to delete event:", error)
      }
    }
  }

  const handleSendSMS = async () => {
    if (!event) return

    try {
      const settings = await db.settings.toArray()
      const gatewayNumber = settings[0]?.smsGateway || "+1234567890"
      await smsManager.sendViaSMS(event, gatewayNumber)
    } catch (error) {
      console.error("Failed to send SMS:", error)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading event details...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!event) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto p-4 max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Event Not Found</h1>
            </div>
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">The requested collection event could not be found.</p>
                <Button onClick={() => router.push("/dashboard")} className="mt-4">
                  Return to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Collection Details</h1>
              <p className="text-muted-foreground">Event ID: {event.eventId}</p>
            </div>
            <StatusBadge status={event.status} />
          </div>

          {/* Event Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Species</label>
                  <p className="text-lg font-medium text-balance">{getSpeciesLabel(event.species)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Farmer ID</label>
                    <p className="font-mono">{event.farmerId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Moisture</label>
                    <p className="flex items-center gap-1">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      {event.quality.moisturePct}%
                    </p>
                  </div>
                </div>

                {event.quality.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="text-balance">{event.quality.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location & Time */}
            <Card>
              <CardHeader>
                <CardTitle>Location & Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    GPS Coordinates
                  </label>
                  <p className="font-mono">{formatLocation(event.location.lat, event.location.lon)}</p>
                  <p className="text-sm text-muted-foreground">Accuracy: ±{Math.round(event.location.accuracy)}m</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timestamp
                  </label>
                  <p>{new Date(event.timestamp).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Photos */}
            {event.photos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Photos ({event.photos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {event.photos.map((photo, index) => (
                      <div key={photo.hash} className="space-y-2">
                        <img
                          src={photo.blobUrl || "/placeholder.svg"}
                          alt={`Herb photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <p className="text-xs text-muted-foreground font-mono">
                          Hash: {photo.hash.substring(0, 16)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status & Error */}
            <Card>
              <CardHeader>
                <CardTitle>Sync Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Current Status</span>
                  <StatusBadge status={event.status} />
                </div>

                {event.lastError && (
                  <div>
                    <label className="text-sm font-medium text-red-600">Last Error</label>
                    <p className="text-red-600 text-balance">{event.lastError}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">Created</label>
                    <p>{new Date(event.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Updated</label>
                    <p>{new Date(event.updatedAt).toLocaleString()}</p>
                  </div>
                </div>

                {event.onChainTx && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Blockchain TX</label>
                    <p className="font-mono text-sm break-all">{event.onChainTx}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {(event.status === "failed" || event.status === "pending") && (
                    <Button onClick={handleRetry} className="w-full">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retry Sync
                    </Button>
                  )}

                  <Button onClick={handleSendSMS} variant="outline" className="w-full bg-transparent">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send via SMS
                  </Button>

                  <Button onClick={handleDelete} variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Event
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Raw JSON (for debugging) */}
            <Card>
              <CardHeader>
                <CardTitle>Raw Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">{JSON.stringify(event, null, 2)}</pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
