"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { MapPin, Calendar, Droplets, Eye, RotateCcw, Trash2, MessageSquare } from "lucide-react"
import type { CollectionEvent } from "@/lib/db"
import { getSpeciesLabel } from "@/lib/species"
import { formatLocation } from "@/lib/utils"

interface CollectionCardProps {
  event: CollectionEvent
  onView: (event: CollectionEvent) => void
  onRetry: (event: CollectionEvent) => void
  onDelete: (event: CollectionEvent) => void
  onSendSMS: (event: CollectionEvent) => void
}

export function CollectionCard({ event, onView, onRetry, onDelete, onSendSMS }: CollectionCardProps) {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-balance leading-tight text-sm sm:text-base">{getSpeciesLabel(event.species)}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">ID: {event.eventId}</p>
          </div>
          <StatusBadge status={event.status} />
        </div>

        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="font-mono text-xs overflow-hidden text-ellipsis">{formatLocation(event.location.lat, event.location.lon)}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span>{formatDate(event.timestamp)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-muted-foreground" />
            <span>{event.quality.moisturePct}% moisture</span>
          </div>

          {event.photos.length > 0 && (
            <div className="text-muted-foreground">
              📸 {event.photos.length} photo{event.photos.length !== 1 ? "s" : ""}
            </div>
          )}

          {event.quality.notes && <p className="text-muted-foreground italic text-balance">"{event.quality.notes}"</p>}

          {event.lastError && <p className="text-red-600 text-xs text-balance">Error: {event.lastError}</p>}
        </div>

        <div className="flex justify-between mt-3 sm:mt-4">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={() => onView(event)}
            >
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            {(event.status === "failed" || event.status === "pending") && (
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={() => onRetry(event)}
              >
                <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={() => onSendSMS(event)}
            >
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:text-red-700"
              onClick={() => onDelete(event)}
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
