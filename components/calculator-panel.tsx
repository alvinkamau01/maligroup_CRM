"use client"

import { useMemo, useState, useCallback } from "react"
import { TrendingDown, TrendingUp, Search, RefreshCw, Building2, Calculator, Loader2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

type DataSource = "manual" | "supabase"

interface PropertyData {
  id?: string | number
  address: string
  city: string
  state: string
  zip: string
  arv: number
  repairCost: number
  squareFeet?: number
  yearBuilt?: number
  estimatedValue?: number
  lastSoldPrice?: number
  propertyType?: string
}

interface DealInputs {
  arv: number
  repairCost: number
  rulePercent: number
  contractPrice: number
  assignmentFee: number
  wholesalingCosts: number
}

interface DealResults {
  maxAllowableOffer: number
  offerRoom: number
  isOverMao: boolean
  endBuyerPrice: number
  buyerAllInCost: number
  buyerAllInPercentOfArv: number
  buyerProjectedProfit: number
  wholesalerNetProfit: number
  assignmentFeePercentOfArv: number
  totalSpread: number
}

type ChangeHandler = <K extends keyof DealInputs>(key: K, value: DealInputs[K]) => void

const DEFAULT_INPUTS: DealInputs = {
  arv: 300000,
  repairCost: 35000,
  rulePercent: 70,
  contractPrice: 165000,
  assignmentFee: 10000,
  wholesalingCosts: 1500,
}

function calculateDeal(inputs: DealInputs): DealResults {
  const { arv, repairCost, rulePercent, contractPrice, assignmentFee, wholesalingCosts } = inputs

  const maxAllowableOffer = arv * (rulePercent / 100) - repairCost
  const endBuyerPrice = contractPrice + assignmentFee
  const buyerAllInCost = endBuyerPrice + repairCost

  return {
    maxAllowableOffer,
    offerRoom: maxAllowableOffer - contractPrice,
    isOverMao: contractPrice > maxAllowableOffer,
    endBuyerPrice,
    buyerAllInCost,
    buyerAllInPercentOfArv: arv > 0 ? (buyerAllInCost / arv) * 100 : 0,
    buyerProjectedProfit: arv - buyerAllInCost,
    wholesalerNetProfit: assignmentFee - wholesalingCosts,
    assignmentFeePercentOfArv: arv > 0 ? (assignmentFee / arv) * 100 : 0,
    totalSpread: endBuyerPrice - contractPrice,
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)
}

function formatPercent(value: number, decimals = 1): string {
  return `${Number.isFinite(value) ? value.toFixed(decimals) : "0.0"}%`
}

function formatCompactCurrency(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function CalculatorPanel() {
  const [inputs, setInputs] = useState<DealInputs>(DEFAULT_INPUTS)
  const [dataSource, setDataSource] = useState<DataSource>("manual")
  const [searchQuery, setSearchQuery] = useState("")
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const results = useMemo(() => calculateDeal(inputs), [inputs])

  const handleChange: ChangeHandler = useCallback((key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }, [])

  const fetchProperties = async (query: string) => {
    if (!query.trim()) return
    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('property_leads')
        .select('*')
        .or(`address.ilike.%${query}%,city.ilike.%${query}%,zip.ilike.%${query}%`)
        .limit(20)
      
      if (error) throw error
      
      const mappedProperties: PropertyData[] = (data || []).map((row: any) => ({
        id: row.id || row.property_lead_id,
        address: row.address || '',
        city: row.city || '',
        state: row.state || '',
        zip: row.zip || '',
        arv: row.estimated_value || row.estimatedValue || row.last_sold_price * 1.15 || 0,
        repairCost: row.repair_estimate || 0,
        squareFeet: row.living_area_sf || row.livingAreaSf || 0,
        yearBuilt: row.year_built || row.yearBuilt || 0,
        estimatedValue: row.estimated_value || row.estimatedValue || 0,
        lastSoldPrice: row.last_sold_price || row.lastSoldPrice || 0,
        propertyType: row.property_type || row.propertyType || '',
      }))
      
      setProperties(mappedProperties)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch properties")
      setProperties([])
    } finally {
      setIsLoading(false)
    }
  }

  const handlePropertySelect = (property: PropertyData) => {
    setSelectedProperty(property)
    const estimatedArv = property.arv || property.estimatedValue || property.lastSoldPrice * 1.15 || 300000
    const estimatedRepair = property.repairCost || estimateRepairs(property)
    
    handleChange("arv", Math.round(estimatedArv))
    handleChange("repairCost", Math.round(estimatedRepair))
    setDataSource("supabase")
  }

  const estimateRepairs = (property: PropertyData): number => {
    const age = property.yearBuilt > 0 ? Math.max(0, new Date().getFullYear() - property.yearBuilt) : 25
    const repairPerSf = age > 40 ? 28 : age > 20 ? 18 : age > 10 ? 10 : 5
    const sf = property.squareFeet > 0 ? property.squareFeet : 1500
    return Math.round(repairPerSf * sf)
  }

  const handleManualEntry = () => {
    setDataSource("manual")
    setSelectedProperty(null)
    setProperties([])
    setSearchQuery("")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProperties(searchQuery)
  }

  const getFullAddress = (prop: PropertyData) => {
    return `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip}`.trim()
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex flex-col gap-2 border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" aria-hidden="true" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Deal Analyzer
            </span>
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Wholesale Offer Calculator
          </h1>
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
            Run ARV, repairs, and the offer rule against your contract to find your max
            allowable offer, assignment fee spread, and the profit left for your end buyer.
          </p>
        </header>

        {/* Data Source Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
              Data Source
            </CardTitle>
            <CardDescription>
              Choose how to populate property data: enter manually or fetch from your Supabase database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select
                value={dataSource}
                onValueChange={(value) => setDataSource(value as DataSource)}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Manual Entry
                    </div>
                  </SelectItem>
                  <SelectItem value="supabase">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Supabase Database
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {dataSource === "supabase" && (
                <div className="flex gap-2 flex-1">
                  <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by address, city, or ZIP..."
                        className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        "Search"
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {dataSource === "manual" && selectedProperty && (
                <Button variant="outline" onClick={handleManualEntry} className="w-fit">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Selection
                </Button>
              )}
            </div>

            {dataSource === "supabase" && error && (
              <div className="mt-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            {dataSource === "supabase" && properties.length > 0 && !selectedProperty && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Select a property:</p>
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {properties.map((prop) => (
                    <Button
                      key={prop.id}
                      variant="outline"
                      onClick={() => handlePropertySelect(prop)}
                      className="w-full justify-start text-left p-3 hover:bg-accent/10"
                    >
                      <div className="font-medium">{getFullAddress(prop)}</div>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                        <span>ARV: {formatCompactCurrency(prop.arv || prop.estimatedValue || 0)}</span>
                        <span>Repairs: {formatCompactCurrency(prop.repairCost || 0)}</span>
                        <span>Type: {prop.propertyType || 'N/A'}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {selectedProperty && (
              <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Selected: {getFullAddress(selectedProperty)}</p>
                    <p className="text-sm text-muted-foreground">
                      ARV: {formatCurrency(selectedProperty.arv || selectedProperty.estimatedValue || 0)} | 
                      Est. Repairs: {formatCurrency(selectedProperty.repairCost || estimateRepairs(selectedProperty))}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleManualEntry}>
                    <RefreshCw className="w-4 h-4" />
                    Change
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="flex flex-col gap-6">
            <DealInputsCard inputs={inputs} onChange={handleChange} />
            <DealTermsCard inputs={inputs} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-6">
            <MaxOfferHero results={results} />
            <DealMetricsGrid results={results} />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <DealSpreadChart inputs={inputs} results={results} />
              <DealMathBreakdown results={results} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

/* ---------- Inputs ---------- */

function CurrencyField({
  id,
  label,
  value,
  onChange,
  description,
}: {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  description?: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <FieldContent>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText className="font-mono text-foreground">$</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id={id}
            type="number"
            inputMode="decimal"
            min={0}
            step={100}
            value={Number.isFinite(value) ? value : 0}
            onChange={(e) => onChange(e.target.valueAsNumber || 0)}
            className="font-mono tabular-nums"
          />
        </InputGroup>
        {description ? <FieldDescription>{description}</FieldDescription> : null}
      </FieldContent>
    </Field>
  )
}

function DealInputsCard({ inputs, onChange }: { inputs: DealInputs; onChange: ChangeHandler }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
          01 — Property & Comps
        </CardTitle>
        <CardDescription>What the house is worth, fixed up, and what it needs.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <CurrencyField
            id="arv"
            label="After Repair Value (ARV)"
            value={inputs.arv}
            onChange={(v) => onChange("arv", v)}
            description="What the property appraises for once fully renovated."
          />
          <CurrencyField
            id="repairCost"
            label="Estimated Repair Cost"
            value={inputs.repairCost}
            onChange={(v) => onChange("repairCost", v)}
            description="Total rehab budget an investor would need to spend."
          />

          <FieldSeparator />

          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <FieldLabel htmlFor="rulePercent">Offer Rule</FieldLabel>
              <span className="font-mono text-lg font-semibold text-primary tabular-nums">
                {inputs.rulePercent}%
              </span>
            </div>
            <Slider
              id="rulePercent"
              value={[inputs.rulePercent]}
              onValueChange={(v) => onChange("rulePercent", Array.isArray(v) ? v[0] : v)}
              min={50}
              max={85}
              step={1}
            />
            <p className="text-sm text-muted-foreground">
              The standard 70% rule caps your offer at 70% of ARV minus repairs. Drop it lower for
              riskier or slower markets.
            </p>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

function DealTermsCard({ inputs, onChange }: { inputs: DealInputs; onChange: ChangeHandler }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
          02 — Contract & Assignment
        </CardTitle>
        <CardDescription>What you&apos;re putting under contract and your fee.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <CurrencyField
            id="contractPrice"
            label="Contract Price to Seller"
            value={inputs.contractPrice}
            onChange={(v) => onChange("contractPrice", v)}
            description="The price you're putting under contract with the seller."
          />
          <CurrencyField
            id="assignmentFee"
            label="Assignment / Wholesale Fee"
            value={inputs.assignmentFee}
            onChange={(v) => onChange("assignmentFee", v)}
            description="Your markup, paid by the end buyer at closing."
          />
          <CurrencyField
            id="wholesalingCosts"
            label="Marketing & Closing Costs"
            value={inputs.wholesalingCosts}
            onChange={(v) => onChange("wholesalingCosts", v)}
            description="Earnest money, title, marketing — costs to run this deal."
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

/* ---------- Results ---------- */

function MaxOfferHero({ results }: { results: DealResults }) {
  return (
    <Card className="border-primary/30 bg-gradient-to-b from-primary/[0.07] to-transparent">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
              Maximum Allowable Offer
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">(ARV × rule%) − repair cost</p>
          </div>
          <Badge variant={results.isOverMao ? "destructive" : "default"}>
            {results.isOverMao ? "Over MAO" : "Within Budget"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-5xl font-semibold tracking-tight text-primary tabular-nums sm:text-6xl">
          {formatCurrency(results.maxAllowableOffer)}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {results.isOverMao ? (
            <>
              Your contract price is{" "}
              <span className="font-mono text-destructive">
                {formatCurrency(Math.abs(results.offerRoom))}
              </span>{" "}
              over the max offer. Renegotiate or cut your fee.
            </>
          ) : (
            <>
              You have{" "}
              <span className="font-mono text-primary">{formatCurrency(results.offerRoom)}</span>{" "}
              of room below the max offer.
            </>
          )}
        </p>
      </CardContent>
    </Card>
  )
}

function DealMetricsGrid({ results }: { results: DealResults }) {
  const buyerProfitPositive = results.buyerProjectedProfit >= 0

  const metrics = [
    {
      label: "End Buyer Price",
      value: formatCurrency(results.endBuyerPrice),
      helper: "Contract price + your fee",
    },
    {
      label: "Buyer All-In Cost",
      value: formatCurrency(results.buyerAllInCost),
      helper: `${formatPercent(results.buyerAllInPercentOfArv)} of ARV`,
    },
    {
      label: "Your Net Profit",
      value: formatCurrency(results.wholesalerNetProfit),
      helper: "Fee minus marketing & closing costs",
    },
    {
      label: "Fee as % of ARV",
      value: formatPercent(results.assignmentFeePercentOfArv),
      helper: "Keep buyers comfortable, usually under 10%",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {metrics.map((metric) => (
        <Card key={metric.label} className="gap-3 py-4">
          <CardContent className="px-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums">{metric.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{metric.helper}</p>
          </CardContent>
        </Card>
      ))}
      <Card className="gap-3 py-4 sm:col-span-2">
        <CardContent className="flex items-center justify-between gap-4 px-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Buyer&apos;s Projected Profit
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              ARV minus buyer all-in cost — the margin that makes this deal sell.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {buyerProfitPositive ? (
              <TrendingUp className="size-5 text-primary" aria-hidden="true" />
            ) : (
              <TrendingDown className="size-5 text-destructive" aria-hidden="true" />
            )}
            <span
              className={cn(
                "font-mono text-2xl font-semibold tabular-nums",
                buyerProfitPositive ? "text-primary" : "text-destructive",
              )}
            >
              {formatCurrency(results.buyerProjectedProfit)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const chartConfig = {
  contractPrice: { label: "Seller Contract", color: "var(--chart-2)" },
  repairCost: { label: "Repairs", color: "var(--chart-4)" },
  assignmentFee: { label: "Your Fee", color: "var(--chart-1)" },
  buyerProfit: { label: "Buyer Profit", color: "var(--chart-3)" },
} satisfies ChartConfig

function DealSpreadChart({ inputs, results }: { inputs: DealInputs; results: DealResults }) {
  const data = [
    {
      name: "ARV",
      contractPrice: inputs.contractPrice,
      repairCost: inputs.repairCost,
      assignmentFee: inputs.assignmentFee,
      buyerProfit: Math.max(results.buyerProjectedProfit, 0),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
          Where the ARV Goes
        </CardTitle>
        <CardDescription>
          Seller price, repairs, your fee, and remaining buyer profit — stacked against ARV.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[140px] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            <Tooltip content={<ChartTooltipContent indicator="dot" />} />
            <Bar
              dataKey="contractPrice"
              stackId="arv"
              fill="var(--color-contractPrice)"
              radius={[4, 0, 0, 4]}
              barSize={56}
            />
            <Bar dataKey="repairCost" stackId="arv" fill="var(--color-repairCost)" barSize={56} />
            <Bar
              dataKey="assignmentFee"
              stackId="arv"
              fill="var(--color-assignmentFee)"
              barSize={56}
            />
            <Bar
              dataKey="buyerProfit"
              stackId="arv"
              fill="var(--color-buyerProfit)"
              radius={[0, 4, 4, 0]}
              barSize={56}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function DealMathBreakdown({ results }: { results: DealResults }) {
  const rows = [
    { label: "Contract price to seller", value: results.endBuyerPrice - results.totalSpread },
    { label: "+ Assignment fee", value: results.totalSpread },
    { label: "= End buyer price", value: results.endBuyerPrice, isSubtotal: true },
    { label: "Wholesaler net profit", value: results.wholesalerNetProfit, isFinal: true },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
          The Math
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-4">
              <span
                className={cn(
                  "text-sm",
                  row.isFinal ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {row.label}
              </span>
              <span
                className={cn(
                  "font-mono tabular-nums",
                  row.isFinal ? "text-lg font-semibold text-primary" : "text-sm text-foreground",
                )}
              >
                {formatCurrency(row.value)}
              </span>
            </div>
            {row.isSubtotal ? <Separator className="mt-2" /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}