import type { CollectionEvent } from "./db"

export class SMSManager {
  private static instance: SMSManager

  static getInstance(): SMSManager {
    if (!SMSManager.instance) {
      SMSManager.instance = new SMSManager()
    }
    return SMSManager.instance
  }

  formatEventForSMS(event: CollectionEvent): string {
    const { farmerId, species, location, timestamp, quality, photos } = event
    const photoHash = photos.length > 0 ? photos[0].hash.substring(0, 8) : "none"

    return `COLLECT|${farmerId}|${species}|${location.lat.toFixed(6)},${location.lon.toFixed(6)}|${timestamp}|${quality.moisturePct}|${photoHash}`
  }

  async sendViaSMS(event: CollectionEvent, gatewayNumber: string): Promise<void> {
    const message = this.formatEventForSMS(event)
    const smsUrl = `sms:${gatewayNumber}?body=${encodeURIComponent(message)}`

    // Open SMS app with pre-filled message
    if (typeof window !== "undefined") {
      window.location.href = smsUrl
    }
  }

  parseEventFromSMS(smsText: string): Partial<CollectionEvent> | null {
    try {
      const parts = smsText.split("|")
      if (parts.length < 6 || parts[0] !== "COLLECT") {
        return null
      }

      const [, farmerId, species, locationStr, timestamp, moisturePct, photoHash] = parts
      const [lat, lon] = locationStr.split(",").map(Number)

      return {
        farmerId,
        species,
        location: { lat, lon, accuracy: 0 },
        timestamp,
        quality: { moisturePct: Number(moisturePct), notes: "" },
        photos: photoHash !== "none" ? [{ blobUrl: "", hash: photoHash }] : [],
        status: "pending",
      }
    } catch (error) {
      console.error("Failed to parse SMS:", error)
      return null
    }
  }
}

export const smsManager = SMSManager.getInstance()
