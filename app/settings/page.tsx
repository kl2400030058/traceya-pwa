"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Trash2, Download, RefreshCw } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { db, type AppSettings } from "@/lib/db"
import { syncManager } from "@/lib/sync"
import { authManager } from "@/lib/auth"
import { i18n } from "@/lib/i18n"

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const allSettings = await db.settings.toArray()
      if (allSettings.length > 0) {
        setSettings(allSettings[0])
        i18n.setLanguage(allSettings[0].language)
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
      setMessage({ type: "error", text: "Failed to load settings" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setIsSaving(true)
    setMessage(null)

    try {
      await db.settings.update(settings.id!, settings)

      // Update language
      i18n.setLanguage(settings.language)

      // Restart auto-sync with new interval
      syncManager.stopAutoSync()
      syncManager.startAutoSync(settings.syncInterval)

      setMessage({ type: "success", text: "Settings saved successfully" })
    } catch (error) {
      console.error("Failed to save settings:", error)
      setMessage({ type: "error", text: "Failed to save settings" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearData = async () => {
    const confirmed = confirm(
      "Are you sure you want to clear all data? This will delete all collection events and cannot be undone.",
    )

    if (!confirmed) return

    try {
      await db.collectionEvents.clear()
      await db.syncQueue.clear()

      setMessage({ type: "success", text: "All data cleared successfully" })
    } catch (error) {
      console.error("Failed to clear data:", error)
      setMessage({ type: "error", text: "Failed to clear data" })
    }
  }

  const handleExportData = async () => {
    try {
      const events = await db.collectionEvents.toArray()
      const dataStr = JSON.stringify(events, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })

      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `traceya-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setMessage({ type: "success", text: "Data exported successfully" })
    } catch (error) {
      console.error("Failed to export data:", error)
      setMessage({ type: "error", text: "Failed to export data" })
    }
  }

  const handleLogout = () => {
    authManager.logout()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!settings) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto p-4 max-w-2xl">
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Settings not found</p>
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
          <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
          </div>

          <div className="space-y-6">
            {/* Sync Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Sync Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="syncInterval">Auto-sync Interval (minutes)</Label>
                  <Select
                    value={settings.syncInterval.toString()}
                    onValueChange={(value) => setSettings({ ...settings, syncInterval: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smsGateway">SMS Gateway Number</Label>
                  <Input
                    id="smsGateway"
                    type="tel"
                    placeholder="+1234567890"
                    value={settings.smsGateway}
                    onChange={(e) => setSettings({ ...settings, smsGateway: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">Phone number to send SMS backup messages</p>
                </div>
              </CardContent>
            </Card>

            {/* App Settings */}
            <Card>
              <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
                <CardTitle className="text-lg sm:text-xl">App Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="language" className="text-sm sm:text-base">Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value: "en" | "hi") => setSettings({ ...settings, language: value })}
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-sm sm:text-base">Farmer ID</Label>
                  <Input value={settings.farmerId} disabled className="bg-muted h-9 sm:h-10 text-sm sm:text-base" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Farmer ID cannot be changed after login</p>
                </div>

                {settings.lastSync && (
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-sm sm:text-base">Last Sync</Label>
                    <Input value={new Date(settings.lastSync).toLocaleString()} disabled className="bg-muted h-9 sm:h-10 text-sm sm:text-base" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleExportData} variant="outline" className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>

                <Button onClick={handleClearData} variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </CardContent>
            </Card>

            {/* Account */}
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleLogout} variant="outline" className="w-full bg-transparent">
                  Logout
                </Button>
              </CardContent>
            </Card>

            {/* Message */}
            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            {/* Save Button */}
            <Button onClick={handleSave} disabled={isSaving} className="w-full h-10 sm:h-12 text-base sm:text-lg">
              {isSaving ? (
                <>
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
