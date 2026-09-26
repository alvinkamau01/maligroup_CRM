"use client"

import { cn } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

function Slider({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }: SliderProps) {
  const [thumbPos, setThumbPos] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  
  const currentValue = value[0] || 0
  const percentage = ((currentValue - min) / (max - min)) * 100

  useEffect(() => {
    setThumbPos(percentage)
  }, [currentValue, min, max])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Math.max(min, Math.min(max, Number(e.target.value)))
    const steppedValue = Math.round(newValue / step) * step
    onValueChange([steppedValue])
  }

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)} {...props}>
      <div 
        ref={trackRef}
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary"
        style={{ '--slider-progress': `${percentage}%` }}
      >
        <div 
          className="absolute h-full bg-primary transition-all duration-100" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        className="absolute h-5 w-5 -translate-y-1/2 top-1/2 appearance-none bg-transparent pointer-events-none cursor-pointer"
        style={{ width: '100%' }}
        aria-label="Slider"
      />
      <div
        className="block h-5 w-5 rounded-full border-2 border-primary bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{ left: `calc(${percentage}% - 10px)` }}
      />
    </div>
  )
}

export { Slider }