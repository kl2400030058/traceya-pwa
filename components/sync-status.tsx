"use client"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WifiOff, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { syncManager, type SyncResult } from "@/lib/sync"
import { db } from "@/lib/db"
import { i18n } from "@/lib/i18n"
import { motion } from "framer-motion"

export function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine)
    loadSyncStatus()

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Listen for service worker messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "BACKGROUND_SYNC") {
        console.log("[SyncStatus] Background sync triggered")
        handleManualSync()
      }
    }

    navigator.serviceWorker?.addEventListener("message", handleMessage)

    // Periodic status updates
    const interval = setInterval(loadSyncStatus, 30000) // Every 30 seconds

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      navigator.serviceWorker?.removeEventListener("message", handleMessage)
      clearInterval(interval)
    }
  }, [])

  const loadSyncStatus = async () => {
    try {
      // Get settings for last sync time
      const settings = await db.settings.toArray()
      if (settings.length > 0) {
        setLastSync(settings[0].lastSync)
      }

      // Count pending events
      const pending = await db.collectionEvents.where("status").anyOf(["pending", "failed"]).count()

      setPendingCount(pending)

      // Update sync in progress status
      setIsSyncing(syncManager.isSyncInProgress())
    } catch (error) {
      console.error("[SyncStatus] Failed to load sync status:", error)
    }
  }

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return

    setIsSyncing(true)
    try {
      const result = await syncManager.syncData()
      setLastSyncResult(result)
      await loadSyncStatus()

      // Clear result after 5 seconds
      setTimeout(() => setLastSyncResult(null), 5000)
    } catch (error) {
      console.error("[SyncStatus] Manual sync failed:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return "Never"

    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const getSyncStatusColor = () => {
    if (!isOnline) return "bg-gray-500"
    if (isSyncing) return "bg-blue-500"
    if (pendingCount > 0) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getSyncStatusText = () => {
    if (!isOnline) return i18n.t("common.offline")
    if (isSyncing) return "Syncing..."
    if (pendingCount > 0) return `${pendingCount} ${i18n.t("status.pending").toLowerCase()}`
    return "Up to date"
  }

  const getSyncIcon = () => {
    if (!isOnline) return <WifiOff className="h-3 w-3" />
    if (isSyncing) return <RefreshCw className="h-3 w-3 animate-spin" />
    if (pendingCount > 0) return <AlertCircle className="h-3 w-3" />
    return <CheckCircle className="h-3 w-3" />
  }

  return (
    <div className="flex items-center gap-2">
      <motion.div
        whileHover={{ scale: 1.05 }}
        animate={!isOnline ? {} : isSyncing ? { rotate: 360 } : pendingCount > 0 ? { y: [0, -2, 0] } : { scale: [1, 1.05, 1] }}
        transition={!isOnline ? {} : isSyncing ? { duration: 2, repeat: Infinity, ease: "linear" } : pendingCount > 0 ? { duration: 1.5, repeat: Infinity } : { duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
      >
        <Badge className={`${getSyncStatusColor()} text-white flex items-center gap-1 shadow-sm px-3 py-1`}>
          {getSyncIcon()}
          {getSyncStatusText()}
        </Badge>
      </motion.div>

      {isOnline && !isSyncing && pendingCount > 0 && (
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button 
            onClick={handleManualSync} 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs bg-gradient-to-r from-blue-50 to-white border border-blue-100 hover:bg-blue-100 transition-colors duration-300"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <RefreshCw className="h-3 w-3 mr-1 text-blue-600" />
            </motion.div>
            Sync
          </Button>
        </motion.div>
      )}

      {lastSync && (
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-medium text-muted-foreground"
        >
          Last: {formatLastSync(lastSync)}
        </motion.span>
      )}

      {lastSyncResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <Badge 
            variant={lastSyncResult.success ? "default" : "destructive"} 
            className={`text-xs ${lastSyncResult.success ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gradient-to-r from-red-500 to-red-600"} shadow-sm`}
          >
            {lastSyncResult.success ? `✓ ${lastSyncResult.synced} synced` : `✗ ${lastSyncResult.failed} failed`}
          </Badge>
        </motion.div>
      )}
    </div>
  )
}
