"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Thermometer, Droplets, Mountain } from "lucide-react"

export interface EnvironmentalConditionsData {
  temperature?: number
  humidity?: number
  soilType?: string
  altitude?: number
}

interface EnvironmentalConditionsProps {
  value: EnvironmentalConditionsData
  onChange: (data: EnvironmentalConditionsData) => void
}

const SOIL_TYPES = [
  { value: "sandy", label: "Sandy" },
  { value: "clay", label: "Clay" },
  { value: "silty", label: "Silty" },
  { value: "peaty", label: "Peaty" },
  { value: "chalky", label: "Chalky" },
  { value: "loamy", label: "Loamy" },
  { value: "other", label: "Other" },
]

export function EnvironmentalConditions({ value, onChange }: EnvironmentalConditionsProps) {
  const handleChange = (field: keyof EnvironmentalConditionsData, newValue: string | number | undefined) => {
    onChange({
      ...value,
      [field]: newValue,
    })
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-medium">Environmental Conditions</h3>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="temperature" className="flex items-center gap-1.5">
              <Thermometer className="h-3.5 w-3.5" />
              <span>Temperature (°C)</span>
            </Label>
            <Input
              id="temperature"
              type="number"
              placeholder="Enter temperature"
              value={value.temperature || ""}
              onChange={(e) => handleChange("temperature", e.target.value ? Number(e.target.value) : undefined)}
              className="h-9 sm:h-10 text-sm sm:text-base"
              min="-50"
              max="60"
              step="0.1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="humidity" className="flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5" />
              <span>Humidity (%)</span>
            </Label>
            <Input
              id="humidity"
              type="number"
              placeholder="Enter humidity"
              value={value.humidity || ""}
              onChange={(e) => handleChange("humidity", e.target.value ? Number(e.target.value) : undefined)}
              className="h-9 sm:h-10 text-sm sm:text-base"
              min="0"
              max="100"
              step="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="soilType" className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M8 22h8"/><path d="M12 22v-7"/><path d="M4.2 10.4 12 4l7.8 6.4"/><path d="M18 10H6a4 4 0 0 0-4 4v3a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-3a4 4 0 0 0-4-4Z"/>
              </svg>
              <span>Soil Type</span>
            </Label>
            <Select
              value={value.soilType || ""}
              onValueChange={(val) => handleChange("soilType", val)}
            >
              <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                <SelectValue placeholder="Select soil type" />
              </SelectTrigger>
              <SelectContent>
                {SOIL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-sm sm:text-base">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="altitude" className="flex items-center gap-1.5">
              <Mountain className="h-3.5 w-3.5" />
              <span>Altitude (m)</span>
            </Label>
            <Input
              id="altitude"
              type="number"
              placeholder="Enter altitude"
              value={value.altitude || ""}
              onChange={(e) => handleChange("altitude", e.target.value ? Number(e.target.value) : undefined)}
              className="h-9 sm:h-10 text-sm sm:text-base"
              min="0"
              max="10000"
              step="1"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}