import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import type { MotionProps } from "framer-motion"

interface StatsCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  index?: number
}

export function StatsCard({ title, value, icon, color, index = 0 }: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value);
    }, 300 + index * 100);
    
    return () => clearTimeout(timer);
  }, [value, index]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
    >
      <Card className="overflow-hidden bg-gradient-to-br from-white to-gray-50 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl border border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
          <CardTitle className="text-sm font-medium text-balance">{title}</CardTitle>
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.1 }}
            className={`p-2 rounded-full ${color}`}
          >
            {icon}
          </motion.div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <motion.div 
            className="text-2xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {displayValue}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
