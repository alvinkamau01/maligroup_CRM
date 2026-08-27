'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Building2,
  Filter,
  Loader2,
  MapPin,
  Search as SearchIcon,
  Sparkles,
  MessageSquare,
  UserRound,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  LEAD_TYPE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  STAGE_LABELS,
  STAGE_ORDER,
  formatCompactCurrency,
  mapPipelineRow,
  type PipelineRow,
  type PipelineStage,
} from '@/lib/buybox'
import { PropertyPipelineDrawer } from '@/components/property-pipeline-drawer'

const LOCATION_EXAMPLES = [
  "City + state, e.g. 'Miami, FL'",
  "State code, e.g. 'FL'",
  "ZIP code, e.g. '33142'",
  'Mix any combination, comma separated',
]

const OWNERSHIP_OPTIONS = [
  { value: 'individual_owned', label: 'Individually owned' },
  { value: 'company_owned', label: 'Company owned' },
  { value: 'trust_owned', label: 'Trust owned' },
  { value: 'owner_occupied', label: 'Owner occupied' },
]

const EQUITY_OPTIONS = [
  { value: 'high_equity', label: 'High equity (50%+)' },
  { value: 'free_and_clear', label: 'Free and clear' },
  { value: 'low_equity', label: 'Low equity' },
  { value: 'negative_equity', label: 'Negative equity' },
]

const STAGE_ICONS: Record<PipelineStage, typeof SearchIcon> = {
  new_match: Sparkles,
  skip_traced: UserRound,
  conversed: MessageSquare,
  under_contract: FileText,
}

function TogglePill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border-2 px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
        active
          ? 'border-accent bg-accent text-accent-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-accent/50 hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}

function StageCountCard({
  stage,
  count,
  active,
  onClick,
}: {
  stage: PipelineStage
  count: number
  active: boolean
  onClick: () => void
}) {
  const Icon = STAGE_ICONS[stage]
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors',
        active ? 'border-accent ring-1 ring-accent/40' : 'border-border hover:border-accent/40'
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          active ? 'bg-accent text-accent-foreground' : 'bg-muted text-accent/70'
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-[0.1em] text-foreground">{STAGE_LABELS[stage]}</p>
      <span className={cn('shrink-0 text-2xl font-bold tabular-nums', active ? 'text-accent' : 'text-foreground')}>{count}</span>
    </button>
  )
}

export function BuyBoxPanel() {
  const [locationQuery, setLocationQuery] = useState('')
  const [propertyTypes, setPropertyTypes] = useState<string[]>([])
  const [leadTypes, setLeadTypes] = useState<string[]>([])
  const [ownership, setOwnership] = useState<string[]>([])
  const [equity, setEquity] = useState<string[]>([])
  const [activeStage, setActiveStage] = useState<PipelineStage | null>(null)
  const [rows, setRows] = useState<PipelineRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<PipelineRow | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const toggle = (list: string[], setList: (next: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  }

  const loadPipeline = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    propertyTypes.forEach((value) => params.append('property_type', value))
    const combinedLeadTypes = [...leadTypes, ...ownership.filter((v) => v !== 'owner_occupied'), ...equity]
    combinedLeadTypes.forEach((value) => params.append('lead_type', value))
    if (activeStage) params.set('stage', activeStage)
    try {
      const response = await fetch(`/api/buybox/pipeline?${params.toString()}`, { cache: 'no-store' })
      const payload = await response.json().catch(() => ({ rows: [] }))
      const mapped = Array.isArray(payload.rows) ? payload.rows.map(mapPipelineRow) : []
      setRows(mapped)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [propertyTypes, leadTypes, ownership, equity, activeStage])

  useEffect(() => {
    void loadPipeline()
  }, [loadPipeline])

  const grouped = useMemo(() => {
    const map: Record<PipelineStage, PipelineRow[]> = {
      new_match: [],
      skip_traced: [],
      conversed: [],
      under_contract: [],
    }
    for (const row of rows) map[row.stage].push(row)
    return map
  }, [rows])

  async function runSearch() {
    if (!locationQuery.trim()) return
    setSearching(true)
    setSearchError(null)
    try {
      const response = await fetch('/api/buybox/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locations: locationQuery,
          filters: { propertyTypes, leadTypes: [...leadTypes, ...ownership.filter((v) => v !== 'owner_occupied'), ...equity] },
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setSearchError(payload?.error ?? 'Buy Box search could not be reached.')
        return
      }
      await loadPipeline()
    } catch {
      setSearchError('Buy Box search could not be reached.')
    } finally {
      setSearching(false)
    }
  }

  function openRow(row: PipelineRow) {
    setSelectedRow(row)
    setDrawerOpen(true)
  }

  const anyFilterActive =
    propertyTypes.length > 0 || leadTypes.length > 0 || ownership.length > 0 || equity.length > 0 || activeStage !== null

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: search bar + location example pills */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={locationQuery}
              onChange={(event) => setLocationQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) void runSearch()
              }}
              placeholder="US locations to search: city name with state (e.g. 'Miami, FL'), state code (e.g. 'FL'), or ZIP code (e.g. '33142'). Mix any combination."
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus:border-accent focus:outline-none"
            />
          </div>
          <Button onClick={runSearch} disabled={searching || !locationQuery.trim()} className="shrink-0">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" data-icon="inline-start" /> : <SearchIcon data-icon="inline-start" />}
            Search Buy Box
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {LOCATION_EXAMPLES.map((example) => (
            <span key={example} className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground">
              {example}
            </span>
          ))}
        </div>
        {searchError && <p className="mt-2 text-xs text-destructive">{searchError}</p>}
      </div>

      {/* Row 2: filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-accent" />
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Filter matches</p>
          {anyFilterActive && (
            <button
              onClick={() => { setPropertyTypes([]); setLeadTypes([]); setOwnership([]); setEquity([]); setActiveStage(null) }}
              className="ml-auto text-[11px] font-medium text-accent hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {STAGE_ORDER.map((stage) => {
            const Icon = STAGE_ICONS[stage]
            const isActive = activeStage === stage
            return (
              <TogglePill key={stage} active={isActive} onClick={() => setActiveStage(isActive ? null : stage)}>
                <span className="inline-flex items-center gap-1.5">
                  <Icon className="h-3 w-3" />
                  {STAGE_LABELS[stage]}
                </span>
              </TogglePill>
            )
          })}
          <span className="mx-1 my-auto h-4 w-px bg-border" />
          {PROPERTY_TYPE_OPTIONS.map((option) => (
            <TogglePill key={option.value} active={propertyTypes.includes(option.value)} onClick={() => toggle(propertyTypes, setPropertyTypes, option.value)}>
              {option.label}
            </TogglePill>
          ))}
          <span className="mx-1 my-auto h-4 w-px bg-border" />
          {OWNERSHIP_OPTIONS.map((option) => (
            <TogglePill key={option.value} active={ownership.includes(option.value)} onClick={() => toggle(ownership, setOwnership, option.value)}>
              {option.label}
            </TogglePill>
          ))}
          <span className="mx-1 my-auto h-4 w-px bg-border" />
          {EQUITY_OPTIONS.map((option) => (
            <TogglePill key={option.value} active={equity.includes(option.value)} onClick={() => toggle(equity, setEquity, option.value)}>
              {option.label}
            </TogglePill>
          ))}
          <span className="mx-1 my-auto h-4 w-px bg-border" />
          {LEAD_TYPE_OPTIONS.filter((option) => option.group === 'ownership' && option.value !== 'absentee_owner').slice(0, 4).map((option) => (
            <TogglePill key={option.value} active={leadTypes.includes(option.value)} onClick={() => toggle(leadTypes, setLeadTypes, option.value)}>
              {option.label}
            </TogglePill>
          ))}
        </div>
      </div>

      {/* Row 3: stages (1 part) + fetched properties (6 parts) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <div className="flex flex-col gap-3 lg:col-span-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Pipeline stages</p>
            {activeStage && (
              <button onClick={() => setActiveStage(null)} className="ml-auto text-[11px] font-medium text-accent hover:underline">
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {STAGE_ORDER.map((stage) => (
              <StageCountCard
                key={stage}
                stage={stage}
                count={grouped[stage].length}
                active={activeStage === stage}
                onClick={() => setActiveStage(activeStage === stage ? null : stage)}
              />
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-col rounded-xl border border-border bg-card lg:col-span-6">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <MapPin className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold">Fetched properties</p>
            <span className="ml-auto text-xs text-muted-foreground">{rows.length} results</span>
          </div>
          <div className="max-h-[32rem] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading Buy Box matches…
              </div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Search a location above to pull matching properties into your Buy Box.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Address</th>
                    <th className="px-4 py-2 font-medium">Est. value</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.propertyLeadId}
                      onClick={() => openRow(row)}
                      className="cursor-pointer border-b border-border/60 last:border-b-0 hover:bg-muted/60"
                    >
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{row.address || 'Unknown address'}</p>
                        <p className="text-xs text-muted-foreground">{[row.city, row.state, row.zip].filter(Boolean).join(', ')}</p>
                      </td>
                      <td className="px-4 py-2.5 font-semibold">{formatCompactCurrency(row.estimatedValue)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {row.propertyType || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <PropertyPipelineDrawer row={selectedRow} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  )
}
