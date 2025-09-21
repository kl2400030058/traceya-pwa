import { Badge } from "@/components/ui/badge"
import { getStatusColor } from "@/lib/utils"
import { CheckCircle, Clock, Upload, AlertCircle } from "lucide-react"

interface StatusBadgeProps {
  status: "pending" | "uploading" | "synced" | "failed"
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getIcon = () => {
    switch (status) {
      case "synced":
        return <CheckCircle className="h-3 w-3" />
      case "pending":
        return <Clock className="h-3 w-3" />
      case "uploading":
        return <Upload className="h-3 w-3" />
      case "failed":
        return <AlertCircle className="h-3 w-3" />
    }
  }

  const getLabel = () => {
    switch (status) {
      case "synced":
        return "Synced"
      case "pending":
        return "Pending"
      case "uploading":
        return "Uploading"
      case "failed":
        return "Failed"
    }
  }

  return (
    <Badge className={`${getStatusColor(status)} ${className} flex items-center gap-1`}>
      {getIcon()}
      {getLabel()}
    </Badge>
  )
}
