"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Filter, RefreshCw } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { CollectionCard } from "@/components/collection-card"
import { db, type CollectionEvent } from "@/lib/db"
import { authManager } from "@/lib/auth"
import { smsManager } from "@/lib/sms"

export default function QueuePage() {
  const router = useRouter()
  const [events, setEvents] = useState<CollectionEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<CollectionEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchTerm, statusFilter])

  const loadEvents = async () => {
    setIsLoading(true)
    try {
      // Ensure authManager is only accessed on the client side
      const farmerId = typeof window !== 'undefined' ? authManager?.getFarmerId() : null
      if (!farmerId) return

      const allEvents = await db.collectionEvents.where("farmerId").equals(farmerId).reverse().sortBy("createdAt")

      setEvents(allEvents)
    } catch (error) {
      console.error("Failed to load events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.eventId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.quality.notes.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((event) => event.status === statusFilter)
    }

    setFilteredEvents(filtered)
  }

  const handleViewEvent = (event: CollectionEvent) => {
    router.push(`/event/${event.eventId}`)
  }

  const handleRetryEvent = async (event: CollectionEvent) => {
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
        loadEvents()
      }, 2000)

      loadEvents()
    } catch (error) {
      console.error("Failed to retry event:", error)
    }
  }

  const handleDeleteEvent = async (event: CollectionEvent) => {
    if (confirm("Are you sure you want to delete this collection event?")) {
      try {
        await db.collectionEvents.delete(event.id!)
        loadEvents()
      } catch (error) {
        console.error("Failed to delete event:", error)
      }
    }
  }

  const handleSendSMS = async (event: CollectionEvent) => {
    try {
      const settings = await db.settings.toArray()
      const gatewayNumber = settings[0]?.smsGateway || "+1234567890"
      await smsManager.sendViaSMS(event, gatewayNumber)
    } catch (error) {
      console.error("Failed to send SMS:", error)
    }
  }

  const handleRetryAll = async () => {
    const failedEvents = events.filter((e) => e.status === "failed")

    for (const event of failedEvents) {
      await handleRetryEvent(event)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Collection Queue</h1>
              <p className="text-muted-foreground">
                {filteredEvents.length} of {events.length} collections
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadEvents} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by species, ID, or notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="synced">Synced</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="uploading">Uploading</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {events.some((e) => e.status === "failed") && (
                  <Button onClick={handleRetryAll} variant="outline">
                    Retry All Failed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Collections List */}
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Loading collections...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {events.length === 0 ? "No collections yet" : "No collections match your filters"}
                </p>
                {events.length === 0 && (
                  <Button onClick={() => router.push("/capture")}>Create Your First Collection</Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <CollectionCard
                  key={event.eventId}
                  event={event}
                  onView={handleViewEvent}
                  onRetry={handleRetryEvent}
                  onDelete={handleDeleteEvent}
                  onSendSMS={handleSendSMS}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
