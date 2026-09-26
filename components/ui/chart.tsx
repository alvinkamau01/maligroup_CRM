"use client"

import { useId, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

interface ChartContainerProps {
  config: ChartConfig
  className?: string
  children: React.ReactNode
}

export function ChartContainer({ config, className, children }: ChartContainerProps) {
  const id = useId()
  const [configVars, setConfigVars] = useState<Record<string, string>>({})

  useEffect(() => {
    const vars: Record<string, string> = {}
    Object.entries(config).forEach(([key, value]) => {
      vars[`--color-${key}`] = value.color
    })
    setConfigVars(vars)
  }, [config])

  return (
    <div
      id={id}
      className={cn("w-full h-full", className)}
      style={configVars as React.CSSProperties}
    >
      {children}
    </div>
  )
}

interface ChartTooltipProps {
  content: React.ReactElement
}

export function ChartTooltip({ content }: ChartTooltipProps) {
  return <>{content}</>
}

interface ChartTooltipContentProps {
  indicator?: "line" | "dot" | "dashed"
  className?: string
  children?: React.ReactNode
}

export function ChartTooltipContent({
  indicator = "dot",
  className,
  children,
}: ChartTooltipContentProps) {
  return (
    <div className={cn("grid gap-1.5 p-3 bg-popover border border-border rounded-lg shadow-lg", className)}>
      {children}
    </div>
  )
}

interface ChartLegendProps {
  content?: React.ReactElement
}

export function ChartLegend({ content }: ChartLegendProps) {
  return <>{content}</>
}

interface ChartLegendContentProps {
  className?: string
  children?: React.ReactNode
}

export function ChartLegendContent({ className, children }: ChartLegendContentProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {children}
    </div>
  )
}

export type { ChartConfig }