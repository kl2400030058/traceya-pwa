"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { formatTimestamp } from "@/lib/utils"

export interface ActivityLogEntry {
  action: string
  timestamp: string
  details?: string
}

interface ActivityLogProps {
  logs: ActivityLogEntry[]
  className?: string
}

export function ActivityLog({ logs, className = "" }: ActivityLogProps) {
  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-medium">Activity Log</h3>
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>Collection Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {logs.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No activity recorded yet
            </div>
          ) : (
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div key={index} className="relative pl-6 pb-3">
                    {/* Timeline connector */}
                    {index < logs.length - 1 && (
                      <div className="absolute left-[11px] top-[18px] bottom-0 w-0.5 bg-muted-foreground/20" />
                    )}
                    
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1.5 h-[18px] w-[18px] rounded-full border-2 border-primary bg-background flex items-center justify-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{log.action}</span>
                        <Badge variant="outline" className="text-xs font-normal">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Badge>
                      </div>
                      {log.details && (
                        <p className="text-xs text-muted-foreground">{log.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface CollectionChecklistProps {
  onComplete: (completedSteps: string[]) => void
  className?: string
}

const COLLECTION_STEPS = [
  { id: "species", label: "Select herb species", required: true },
  { id: "metadata", label: "Add plant characteristics", required: false },
  { id: "environmental", label: "Record environmental conditions", required: false },
  { id: "location", label: "Capture GPS location", required: true },
  { id: "photos", label: "Take at least one photo", required: true },
  { id: "notes", label: "Add collection notes", required: false },
]

export function CollectionChecklist({ onComplete, className = "" }: CollectionChecklistProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  
  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => {
      const newCompleted = prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
      
      // Notify parent component
      onComplete(newCompleted)
      
      return newCompleted
    })
  }
  
  const getCompletionStatus = () => {
    const requiredSteps = COLLECTION_STEPS.filter(step => step.required).map(step => step.id)
    const allRequiredCompleted = requiredSteps.every(step => completedSteps.includes(step))
    const completionPercentage = Math.round(
      (completedSteps.length / COLLECTION_STEPS.length) * 100
    )
    
    return { allRequiredCompleted, completionPercentage }
  }
  
  const { allRequiredCompleted, completionPercentage } = getCompletionStatus()
  
  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-medium">Collection Checklist</h3>
        <Badge variant={allRequiredCompleted ? "default" : "outline"} className="text-xs">
          {completionPercentage}% Complete
        </Badge>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            {COLLECTION_STEPS.map((step) => (
              <div 
                key={step.id}
                className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                onClick={() => toggleStep(step.id)}
              >
                <div className="mt-0.5">
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{step.label}</span>
                    {step.required && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal">
                        Required
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}