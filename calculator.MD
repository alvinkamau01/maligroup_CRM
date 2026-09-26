# Wholesale Offer Calculator — Implementation Guide

A single-page wholesale real estate deal analyzer. Enter ARV, repair costs, offer rule %, contract price, assignment fee, and costs. It calculates your Maximum Allowable Offer (MAO), end buyer price, buyer all-in cost, buyer profit, and your net profit, and shows a stacked bar chart of where the ARV goes.

---

## 1. Requirements

| Item | Version used |
| --- | --- |
| Next.js (App Router) | 16.x |
| React | 19 |
| Tailwind CSS | v4 |
| shadcn/ui | `base-nova` style (Base UI primitives, `@base-ui/react`) |
| recharts | 3.x (installed by shadcn `chart`) |
| lucide-react | icons |

> If your project uses the **Radix** flavor of shadcn/ui instead of Base UI, everything works the same except the `Slider` `onValueChange` handler. See [Radix note](#radix-note).

---

## 2. Install dependencies

If you haven't set up shadcn/ui yet:

```bash
npx shadcn@latest init
```

Add the components the calculator uses:

```bash
npx shadcn@latest add badge card chart field input-group separator slider
```

These go into `components/ui/`. `chart` installs `recharts`. `lucide-react` comes with shadcn init. If it's missing, run:

```bash
npm install lucide-react
```

The `cn()` helper is expected at `@/lib/utils`. shadcn init creates it.

---

## 3. Theme tokens (`app/globals.css`)

The calculator uses a dark slate + amber-gold theme. Replace the `:root` block in your `globals.css` with the one below. If you want to keep your own theme, you can skip this step. The component uses only semantic tokens (`primary`, `muted-foreground`, `chart-1..4`, etc.), so it adapts to your palette.

```css
:root {
  color-scheme: dark;
  --background: oklch(0.17 0.014 262);
  --foreground: oklch(0.95 0.006 90);
  --card: oklch(0.21 0.015 262);
  --card-foreground: oklch(0.95 0.006 90);
  --popover: oklch(0.21 0.015 262);
  --popover-foreground: oklch(0.95 0.006 90);
  --primary: oklch(0.78 0.135 78);
  --primary-foreground: oklch(0.17 0.02 78);
  --secondary: oklch(0.27 0.014 262);
  --secondary-foreground: oklch(0.95 0.006 90);
  --muted: oklch(0.25 0.013 262);
  --muted-foreground: oklch(0.63 0.015 250);
  --accent: oklch(0.27 0.014 262);
  --accent-foreground: oklch(0.78 0.135 78);
  --destructive: oklch(0.63 0.19 25);
  --destructive-foreground: oklch(0.97 0.01 25);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 12%);
  --ring: oklch(0.78 0.135 78 / 50%);
  --chart-1: oklch(0.78 0.135 78);
  --chart-2: oklch(0.6 0.02 250);
  --chart-3: oklch(0.63 0.19 25);
  --chart-4: oklch(0.45 0.02 250);
  --chart-5: oklch(0.35 0.015 250);
  --radius: 0.5rem;
}
```

Make sure your `@theme inline` block maps the fonts:

```css
@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  /* ...existing color mappings from shadcn... */
}
```

---

## 4. Fonts (`app/layout.tsx`)

The UI uses Geist for body text and Geist Mono for figures. Add both fonts and expose them as CSS variables:

```tsx
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "Wholesale Deal Calculator",
  description:
    "Analyze wholesale real estate deals fast: max allowable offer, assignment fee, and buyer spread from ARV and repair costs.",
}

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#2b2417",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
```

---

## 5. The calculator (single file)

Put this in any route, such as `app/page.tsx` or `app/calculator/page.tsx`. It is one self-contained client component.

```tsx
"use client"

import { useMemo, useState } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
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
import { cn } from "@/lib/utils"

/* ---------- Types & calculation ---------- */

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

/* ---------- Page ---------- */

export default function Page() {
  const [inputs, setInputs] = useState<DealInputs>(DEFAULT_INPUTS)
  const results = useMemo(() => calculateDeal(inputs), [inputs])

  const handleChange: ChangeHandler = (key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex flex-col gap-2 border-b border-border pb-6">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Deal Analyzer
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Wholesale Offer Calculator
          </h1>
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
            Run ARV, repairs, and the offer rule against your contract to find your max
            allowable offer, assignment fee spread, and the profit left for your end buyer.
          </p>
        </header>

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
          01 — Property &amp; Comps
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
          02 — Contract &amp; Assignment
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
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
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
```

---

## 6. Formulas reference

| Output | Formula |
| --- | --- |
| Maximum Allowable Offer (MAO) | `ARV × (rule% / 100) − repairCost` |
| Offer room | `MAO − contractPrice` (negative = over MAO) |
| End buyer price | `contractPrice + assignmentFee` |
| Buyer all-in cost | `endBuyerPrice + repairCost` |
| Buyer all-in % of ARV | `buyerAllInCost / ARV × 100` |
| Buyer projected profit | `ARV − buyerAllInCost` |
| Wholesaler net profit | `assignmentFee − wholesalingCosts` |
| Fee % of ARV | `assignmentFee / ARV × 100` |

Default example: ARV $300,000, repairs $35,000, 70% rule, which gives an **MAO of $175,000**. With a $165,000 contract and a $10,000 fee, the end buyer pays $175,000 and you net $8,500.

---

## Radix note

If your shadcn/ui components use **Radix** (`@radix-ui/react-slider`) instead of Base UI, `onValueChange` always receives a `number[]`. You can simplify the slider handler to:

```tsx
onValueChange={(v) => onChange("rulePercent", v[0])}
```

The version in the file (`Array.isArray(v) ? v[0] : v`) also works with Radix, so this change is optional.

If your `Field` / `InputGroup` components are missing (older shadcn projects), run `npx shadcn@latest add field input-group` to get them.
