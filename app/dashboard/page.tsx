"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Plus, Settings, WifiOff, Wifi, RefreshCw, Bot, ShieldCheck, FileText, InfoIcon } from "lucide-react"
import { motion } from "framer-motion"

import { AuthGuard } from "@/components/auth-guard"
import { MFAGuard } from "@/components/mfa-guard"
import { CollectionCard } from "@/components/collection-card"
import { StatsCard } from "@/components/stats-card"
import { SyncStatus } from "@/components/sync-status"
import AIAssistant from "@/components/ai-assistant"
import { db, type CollectionEvent, initializeSettings } from "@/lib/db"
import { authManager } from "@/lib/auth"
import { smsManager } from "@/lib/sms"
import { syncManager } from "@/lib/sync"
import { zkpService } from "@/services/zkpservice"
import { ipfsService } from "@/services/ipfsservice"

export default function DashboardPage() {
  const router = useRouter()
  const [events, setEvents] = useState<CollectionEvent[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [showAssistant, setShowAssistant] = useState(false)
  const [stats, setStats] = useState({
    synced: 0,
    pending: 0,
    uploading: 0,
    failed: 0,
    proofs: 0,
    files: 0,
  })

  useEffect(() => {
    initializeSettings()
    loadEvents()
    loadAdvancedFeatures()

    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    setIsOnline(navigator.onLine)

    const startAutoSync = async () => {
      const settings = await db.settings.toArray()
      const syncInterval = settings[0]?.syncInterval || 15
      syncManager.startAutoSync(syncInterval)
    }

    startAutoSync()

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      syncManager.stopAutoSync()
    }
  }, [])

  const loadEvents = async () => {
    setIsLoading(true)
    try {
      // Ensure authManager is only accessed on the client side
      const farmerId = typeof window !== 'undefined' ? authManager?.getFarmerId() : null
      if (!farmerId) return

      const allEvents = await db.collectionEvents.where("farmerId").equals(farmerId).reverse().sortBy("createdAt")

      setEvents(allEvents)

      // Calculate stats
      const newStats = {
        synced: allEvents.filter((e: CollectionEvent) => e.status === "synced").length,
        pending: allEvents.filter((e: CollectionEvent) => e.status === "pending").length,
        uploading: allEvents.filter((e: CollectionEvent) => e.status === "uploading").length,
        failed: allEvents.filter((e: CollectionEvent) => e.status === "failed").length,
        proofs: stats.proofs,
        files: stats.files,
      }
      setStats(newStats)
    } catch (error) {
      console.error("Failed to load events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAdvancedFeatures = async () => {
    try {
      const userId = typeof window !== 'undefined' ? authManager?.getUserId() : null
      if (!userId) return

      // Set default values in case of errors
      let userProofs: string[] = [];
      let userFiles: string[] = [];

      try {
        // Try to initialize services - handle each separately to prevent one failure from affecting the other
        if (typeof zkpService.initialize === 'function') {
          await zkpService.initialize();
          if (typeof zkpService.getProofsForUser === 'function') {
            userProofs = await zkpService.getProofsForUser(userId);
          }
        }
      } catch (zkpError) {
        console.error("ZKP service initialization failed:", zkpError);
      }

      try {
        if (typeof ipfsService.initialize === 'function') {
          await ipfsService.initialize();
          if (typeof ipfsService.getUserFiles === 'function') {
            const files = await ipfsService.getUserFiles(userId);
            userFiles = files.map(file => file.cid);
          }
        }
      } catch (ipfsError) {
        console.error("IPFS service initialization failed:", ipfsError);
      }

      // Update stats with advanced features
      setStats(prev => ({
        ...prev,
        proofs: userProofs.length,
        files: userFiles.length,
      }))
    } catch (error) {
      console.error("Failed to load advanced features:", error)
    }
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

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      authManager?.logout()
      router.push("/login")
    }
  }

  const farmerId = typeof window !== 'undefined' ? authManager?.getFarmerId() : null

  return (
    <MFAGuard>
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-green-100"
          >
            <div>
              <h1 className="text-2xl font-bold text-green-800">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {farmerId}</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => loadEvents()}
                  className="rounded-full hover:bg-green-100 transition-colors duration-300"
                >
                  <RefreshCw className="h-5 w-5 text-green-700" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowAssistant(!showAssistant)}
                  className="rounded-full hover:bg-green-100 transition-colors duration-300"
                >
                  <Bot className="h-5 w-5 text-green-700" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => router.push("/settings")}
                  className="rounded-full hover:bg-green-100 transition-colors duration-300"
                >
                  <Settings className="h-5 w-5 text-green-700" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="rounded-full border-green-200 hover:bg-green-100 hover:text-green-800 transition-all duration-300"
                >
                  Logout
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <SyncStatus />
          </motion.div>

          {/* Offline Banner */}
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert className="mb-6 shadow-md border border-red-100 bg-gradient-to-r from-red-50 to-white">
                <WifiOff className="h-4 w-4 text-red-500" />
                <AlertDescription className="font-medium">
                  You're offline. Collections will be saved locally and synced when connection is restored.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Synced"
              value={stats.synced}
              icon={<Wifi className="h-4 w-4 text-white" />}
              color="bg-gradient-to-br from-green-500 to-green-600 shadow-md"
              index={0}
            />
            <StatsCard
              title="Pending"
              value={stats.pending}
              icon={<RefreshCw className="h-4 w-4 text-white" />}
              color="bg-gradient-to-br from-amber-400 to-amber-500 shadow-md"
              index={1}
            />
            <StatsCard
              title="ZK Proofs"
              value={stats.proofs}
              icon={<ShieldCheck className="h-4 w-4 text-white" />}
              color="bg-gradient-to-br from-blue-500 to-blue-600 shadow-md"
              index={2}
            />
            <StatsCard
              title="IPFS Files"
              value={stats.files}
              icon={<FileText className="h-4 w-4 text-white" />}
              color="bg-gradient-to-br from-purple-500 to-purple-600 shadow-md"
              index={3}
            />
          </div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button 
                onClick={() => router.push("/capture")} 
                className="h-16 text-lg w-full rounded-xl shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300" 
                size="lg"
              >
                <Plus className="h-6 w-6 mr-2" />
                Capture New Collection
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button 
                onClick={() => router.push("/demo/zkp")} 
                className="h-16 text-lg w-full rounded-xl shadow-md border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 text-blue-700 transition-all duration-300" 
                size="lg" 
                variant="outline"
              >
                <ShieldCheck className="h-6 w-6 mr-2" />
                Generate ZK Proof
              </Button>
            </motion.div>
          </motion.div>
          
          {/* New Features Alert */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Alert className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 shadow-sm">
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 5 }}
              >
                <InfoIcon className="h-5 w-5 text-blue-500" />
              </motion.div>
              <AlertTitle className="font-semibold text-blue-700">New Features Available</AlertTitle>
              <AlertDescription className="text-blue-600">
                Try our new Zero-Knowledge Proof demo and IPFS file storage features. Visit the
                <Button variant="link" className="px-1 h-auto text-indigo-600 hover:text-indigo-800 transition-colors" onClick={() => router.push("/demo/ipfs-upload")}>IPFS Upload Demo</Button>
                or
                <Button variant="link" className="px-1 h-auto text-indigo-600 hover:text-indigo-800 transition-colors" onClick={() => router.push("/verify")}>Verification Portal</Button>
              </AlertDescription>
            </Alert>
          </motion.div>

          {/* Recent Collections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card className="shadow-md border-t-4 border-t-primary bg-gradient-to-b from-white to-gray-50">
              <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  Recent Collections
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={loadEvents} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <motion.div 
                    className="text-center py-8"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-2" />
                    </motion.div>
                    <p className="text-muted-foreground">Loading collections...</p>
                  </motion.div>
                ) : events.length === 0 ? (
                  <motion.div 
                    className="text-center py-8"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <p className="text-muted-foreground mb-4">No collections yet</p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => router.push("/capture")} className="shadow-sm hover:shadow-md transition-all duration-300">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Collection
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <div className="space-y-4 py-2">
                    {events.slice(0, 10).map((event, index) => (
                      <motion.div
                        key={event.eventId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.02)" }}
                      >
                        <CollectionCard
                          event={event}
                          onView={handleViewEvent}
                          onRetry={handleRetryEvent}
                          onDelete={handleDeleteEvent}
                          onSendSMS={handleSendSMS}
                        />
                      </motion.div>
                    ))}
                    {events.length > 10 && (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button variant="outline" className="w-full bg-transparent hover:bg-gray-50 transition-all duration-300" onClick={() => router.push("/queue")}>
                          View All Collections ({events.length})
                        </Button>
                      </motion.div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      
      {showAssistant && (
        <AIAssistant 
          initialPrompt="Welcome to your dashboard! I can help you navigate the new features. What would you like to know about?"
          onMinimizeToggle={(minimized) => setShowAssistant(!minimized)}
        />
      )}
    </MFAGuard>
  )
}
