import { db, type CollectionEvent } from "./db"

export interface SyncResult {
  success: boolean
  synced: number
  failed: number
  errors: string[]
}

export class SyncManager {
  private static instance: SyncManager
  private isOnline = true
  private syncInterval: NodeJS.Timeout | null = null
  private syncInProgress = false

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  constructor() {
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine
      window.addEventListener("online", this.handleOnline.bind(this))
      window.addEventListener("offline", this.handleOffline.bind(this))
    }
  }

  private handleOnline() {
    this.isOnline = true
    console.log("[v0] Network online - triggering sync")
    this.syncData()
  }

  private handleOffline() {
    this.isOnline = false
    console.log("[v0] Network offline - stopping sync")
    this.stopAutoSync()
  }

  async startAutoSync(intervalMinutes = 15): Promise<void> {
    this.stopAutoSync()

    if (!this.isOnline) {
      console.log("[v0] Auto-sync not started - offline")
      return
    }

    console.log(`[v0] Starting auto-sync every ${intervalMinutes} minutes`)
    this.syncInterval = setInterval(
      () => {
        if (this.isOnline && !this.syncInProgress) {
          this.syncData()
        }
      },
      intervalMinutes * 60 * 1000,
    )

    // Initial sync
    this.syncData()
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log("[v0] Auto-sync stopped")
    }
  }

  async syncData(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log("[v0] Sync already in progress")
      return { success: false, synced: 0, failed: 0, errors: ["Sync already in progress"] }
    }

    if (!this.isOnline) {
      console.log("[v0] Cannot sync - offline")
      return { success: false, synced: 0, failed: 0, errors: ["Device is offline"] }
    }

    this.syncInProgress = true
    console.log("[v0] Starting sync process")

    try {
      // Get all pending and failed events
      const pendingEvents = await db.collectionEvents.where("status").anyOf(["pending", "failed"]).toArray()

      console.log(`[v0] Found ${pendingEvents.length} events to sync`)

      const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
      }

      for (const event of pendingEvents) {
        try {
          // Mark as uploading
          await db.collectionEvents.update(event.id!, {
            status: "uploading",
            lastError: null,
            updatedAt: new Date().toISOString(),
          })

          // Simulate API call
          const syncSuccess = await this.syncEventToServer(event)

          if (syncSuccess.success) {
            await db.collectionEvents.update(event.id!, {
              status: "synced",
              onChainTx: syncSuccess.txHash,
              lastError: null,
              updatedAt: new Date().toISOString(),
            })
            result.synced++
            console.log(`[v0] Synced event ${event.eventId}`)
          } else {
            await db.collectionEvents.update(event.id!, {
              status: "failed",
              lastError: syncSuccess.error,
              updatedAt: new Date().toISOString(),
            })
            result.failed++
            result.errors.push(`${event.eventId}: ${syncSuccess.error}`)
            console.log(`[v0] Failed to sync event ${event.eventId}: ${syncSuccess.error}`)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          await db.collectionEvents.update(event.id!, {
            status: "failed",
            lastError: errorMessage,
            updatedAt: new Date().toISOString(),
          })
          result.failed++
          result.errors.push(`${event.eventId}: ${errorMessage}`)
          console.log(`[v0] Exception syncing event ${event.eventId}:`, error)
        }
      }

      // Update last sync time in settings
      const settings = await db.settings.toArray()
      if (settings.length > 0) {
        await db.settings.update(settings[0].id!, {
          lastSync: new Date().toISOString(),
        })
      }

      console.log(`[v0] Sync complete: ${result.synced} synced, ${result.failed} failed`)
      return result
    } catch (error) {
      console.error("[v0] Sync process error:", error)
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : "Sync process failed"],
      }
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncEventToServer(
    event: CollectionEvent,
  ): Promise<{ success: boolean; error?: string; txHash?: string }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Simulate 80% success rate
    const success = Math.random() > 0.2

    if (success) {
      return {
        success: true,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      }
    } else {
      const errors = [
        "Network timeout",
        "Server error 500",
        "Invalid data format",
        "Authentication failed",
        "Rate limit exceeded",
      ]
      return {
        success: false,
        error: errors[Math.floor(Math.random() * errors.length)],
      }
    }
  }

  async addToSyncQueue(event: CollectionEvent): Promise<boolean> {
    try {
      if (!event || !event.eventId) {
        console.error("[v0] Invalid event data provided to sync queue")
        return false
      }

      await db.syncQueue.add({
        eventId: event.eventId,
        action: "create",
        data: event,
        retryCount: 0,
        lastAttempt: null,
        createdAt: new Date().toISOString(),
      })
      console.log(`[v0] Added event ${event.eventId} to sync queue`)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("[v0] Failed to add to sync queue:", errorMessage)
      return false
    }
  }

  async processSyncQueue(): Promise<SyncResult> {
    if (!this.isOnline) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: ["Device is offline"],
      }
    }

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    }

    try {
      const queueItems = await db.syncQueue.orderBy("createdAt").toArray()
      
      if (queueItems.length === 0) {
        return result
      }

      for (const item of queueItems) {
        if (!item || !item.id || !item.data) {
          console.error("[v0] Invalid queue item found", item)
          continue
        }

        if (item.retryCount >= 3) {
          // Max retries reached, remove from queue
          await db.syncQueue.delete(item.id)
          result.failed++
          result.errors.push(`${item.eventId}: Max retry count exceeded`)
          continue
        }

        try {
          const syncResult = await this.syncEventToServer(item.data as CollectionEvent)

          if (syncResult.success) {
            // Update original event and remove from queue
            if (item.data.id) {
              await db.collectionEvents.update(item.data.id, {
                status: "synced",
                onChainTx: syncResult.txHash,
                lastError: null,
                updatedAt: new Date().toISOString(),
              })
            }
            await db.syncQueue.delete(item.id)
            result.synced++
          } else {
            // Increment retry count
            await db.syncQueue.update(item.id, {
              retryCount: item.retryCount + 1,
              lastAttempt: new Date().toISOString(),
            })
            result.failed++
            result.errors.push(`${item.eventId}: ${syncResult.error || "Unknown error"}`)
          }
        } catch (itemError) {
          const errorMessage = itemError instanceof Error ? itemError.message : "Unknown error"
          console.error(`[v0] Error processing queue item ${item.eventId}:`, errorMessage)
          
          // Increment retry count
          await db.syncQueue.update(item.id, {
            retryCount: item.retryCount + 1,
            lastAttempt: new Date().toISOString(),
          })
          result.failed++
          result.errors.push(`${item.eventId}: ${errorMessage}`)
        }
      }

      result.success = result.failed === 0
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("[v0] Error processing sync queue:", errorMessage)
      return {
        success: false,
        synced: result.synced,
        failed: result.failed + 1,
        errors: [...result.errors, errorMessage],
      }
    }
  }

  isOnlineStatus(): boolean {
    return this.isOnline
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress
  }

  async syncNow(): Promise<SyncResult> {
    return this.syncData()
  }
}

export const syncManager = SyncManager.getInstance()
