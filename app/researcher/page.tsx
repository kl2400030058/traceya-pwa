"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthGuard } from "@/components/auth-guard"
import { db, type CollectionEvent } from "@/lib/db"
import { authManager } from "@/lib/auth"
import { syncManager } from "@/lib/sync"
import { formatTimestamp } from "@/lib/utils"
import { MapPin, Calendar, Droplets, User, ArrowRight, RefreshCw, FileText, BarChart } from "lucide-react";
import { NotificationCenter } from "@/components/notification-center";
import Link from "next/link";

export default function ResearcherDashboardPage() {
  const router = useRouter()
  const [events, setEvents] = useState<CollectionEvent[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    synced: 0,
    pending: 0,
    uploading: 0,
    failed: 0,
  })

  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Load all events for researchers (no filtering by farmerId)
        const allEvents = await db.collectionEvents.toArray()
        setEvents(allEvents)

        // Calculate stats
        const stats = {
          total: allEvents.length,
          synced: allEvents.filter((e: CollectionEvent) => e.status === "synced").length,
          pending: allEvents.filter((e) => e.status === "pending").length,
          uploading: allEvents.filter((e) => e.status === "uploading").length,
          failed: allEvents.filter((e) => e.status === "failed").length,
        }
        setStats(stats)
      } catch (error) {
        console.error("Failed to load events:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine)
    }

    // Initial load
    loadEvents()

    // Set up online/offline listeners
    window.addEventListener("online", handleOnlineStatusChange)
    window.addEventListener("offline", handleOnlineStatusChange)

    return () => {
      window.removeEventListener("online", handleOnlineStatusChange)
      window.removeEventListener("offline", handleOnlineStatusChange)
    }
  }, [])

  const handleViewEvent = (event: CollectionEvent) => {
    router.push(`/researcher/event/${event.eventId}`)
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await syncManager.syncData()
      const allEvents = await db.collectionEvents.toArray()
      setEvents(allEvents)

      // Recalculate stats
      const stats = {
        total: allEvents.length,
        synced: allEvents.filter((e) => e.status === "synced").length,
        pending: allEvents.filter((e) => e.status === "pending").length,
        uploading: allEvents.filter((e) => e.status === "uploading").length,
        failed: allEvents.filter((e) => e.status === "failed").length,
      }
      setStats(stats)
    } catch (error) {
      console.error("Failed to refresh data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Researcher Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link href="/researcher/lab">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Lab Certificates
            </Button>
          </Link>
          <Link href="/researcher/analytics">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <BarChart className="h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <NotificationCenter />
        </div>
      </div>

        {!isOnline && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-800 text-sm">
              You are currently offline. Some features may be limited.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Collection Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 p-2 rounded-md">
                <p className="text-xl font-semibold text-green-700">{stats.synced}</p>
                <p className="text-xs text-green-600">Synced</p>
              </div>
              <div className="bg-amber-50 p-2 rounded-md">
                <p className="text-xl font-semibold text-amber-700">{stats.pending + stats.uploading}</p>
                <p className="text-xs text-amber-600">Pending</p>
              </div>
              <div className="bg-red-50 p-2 rounded-md">
                <p className="text-xl font-semibold text-red-700">{stats.failed}</p>
                <p className="text-xs text-red-600">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="synced">Synced</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>

          {["all", "synced", "pending", "failed"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {events
                .filter((event) => {
                  if (tab === "all") return true
                  if (tab === "synced") return event.status === "synced"
                  if (tab === "pending") return event.status === "pending" || event.status === "uploading"
                  if (tab === "failed") return event.status === "failed"
                  return true
                })
                .map((event) => (
                  <Card key={event.eventId} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{event.species}</h3>
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

                        <div className="space-y-1 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            <span>Collector: {event.farmerId}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatTimestamp(new Date(event.timestamp))}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>
                              {event.location.lat.toFixed(4)}, {event.location.lon.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Droplets className="h-3.5 w-3.5" />
                            <span>Moisture: {event.quality.moisturePct}%</span>
                          </div>
                        </div>

                        {event.photos.length > 0 && (
                          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                            {event.photos.map((photo, index) => (
                              <div key={photo.hash} className="relative flex-shrink-0">
                                <img
                                  src={photo.blobUrl}
                                  alt={`Photo ${index + 1}`}
                                  className="h-16 w-16 object-cover rounded-md"
                                />
                                {photo.location && (
                                  <div className="absolute bottom-0 right-0 bg-black/50 rounded-bl-md rounded-tr-md p-0.5">
                                    <MapPin className="h-2.5 w-2.5 text-white" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full flex items-center justify-center gap-1 mt-1"
                          onClick={() => handleViewEvent(event)}
                        >
                          View Details
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {events.filter((event) => {
                if (tab === "all") return true
                if (tab === "synced") return event.status === "synced"
                if (tab === "pending") return event.status === "pending" || event.status === "uploading"
                if (tab === "failed") return event.status === "failed"
                return true
              }).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No {tab === "all" ? "" : tab} collection events found</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AuthGuard>
  )
}