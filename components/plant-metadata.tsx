"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Leaf, Flower2, Ruler } from "lucide-react"

export interface PlantMetadataData {
  maturityStage?: string
  leafColor?: string
  floweringState?: string
  height?: number
}

interface PlantMetadataProps {
  value: PlantMetadataData
  onChange: (data: PlantMetadataData) => void
}

const MATURITY_STAGES = [
  { value: "seedling", label: "Seedling" },
  { value: "vegetative", label: "Vegetative" },
  { value: "flowering", label: "Flowering" },
  { value: "mature", label: "Mature" },
  { value: "harvested", label: "Harvested" },
]

const LEAF_COLORS = [
  { value: "dark-green", label: "Dark Green" },
  { value: "light-green", label: "Light Green" },
  { value: "yellow-green", label: "Yellow-Green" },
  { value: "red-tinted", label: "Red-Tinted" },
  { value: "purple-tinted", label: "Purple-Tinted" },
  { value: "variegated", label: "Variegated" },
  { value: "other", label: "Other" },
]

const FLOWERING_STATES = [
  { value: "not-flowering", label: "Not Flowering" },
  { value: "budding", label: "Budding" },
  { value: "partial-bloom", label: "Partial Bloom" },
  { value: "full-bloom", label: "Full Bloom" },
  { value: "post-bloom", label: "Post Bloom" },
]

export function PlantMetadata({ value, onChange }: PlantMetadataProps) {
  const handleChange = (field: keyof PlantMetadataData, newValue: string | number | undefined) => {
    onChange({
      ...value,
      [field]: newValue,
    })
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-medium">Plant Characteristics</h3>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maturityStage" className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M2 22a10 10 0 0 1 20 0"/><path d="M12 6a4 4 0 0 1 4 4"/><path d="M12 2v4"/><path d="M4 10a8 8 0 0 1 16 0"/><path d="M18 14a4 4 0 0 1-8 0"/>
              </svg>
              <span>Maturity Stage</span>
            </Label>
            <Select
              value={value.maturityStage || ""}
              onValueChange={(val) => handleChange("maturityStage", val)}
            >
              <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                <SelectValue placeholder="Select maturity stage" />
              </SelectTrigger>
              <SelectContent>
                {MATURITY_STAGES.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value} className="text-sm sm:text-base">
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leafColor" className="flex items-center gap-1.5">
              <Leaf className="h-3.5 w-3.5" />
              <span>Leaf Color</span>
            </Label>
            <Select
              value={value.leafColor || ""}
              onValueChange={(val) => handleChange("leafColor", val)}
            >
              <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                <SelectValue placeholder="Select leaf color" />
              </SelectTrigger>
              <SelectContent>
                {LEAF_COLORS.map((color) => (
                  <SelectItem key={color.value} value={color.value} className="text-sm sm:text-base">
                    {color.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="floweringState" className="flex items-center gap-1.5">
              <Flower2 className="h-3.5 w-3.5" />
              <span>Flowering State</span>
            </Label>
            <Select
              value={value.floweringState || ""}
              onValueChange={(val) => handleChange("floweringState", val)}
            >
              <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                <SelectValue placeholder="Select flowering state" />
              </SelectTrigger>
              <SelectContent>
                {FLOWERING_STATES.map((state) => (
                  <SelectItem key={state.value} value={state.value} className="text-sm sm:text-base">
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="height" className="flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5" />
              <span>Height (cm)</span>
            </Label>
            <Input
              id="height"
              type="number"
              placeholder="Enter plant height"
              value={value.height || ""}
              onChange={(e) => handleChange("height", e.target.value ? Number(e.target.value) : undefined)}
              className="h-9 sm:h-10 text-sm sm:text-base"
              min="0"
              max="1000"
              step="0.1"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}