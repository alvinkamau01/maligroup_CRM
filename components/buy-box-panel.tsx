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
  RefreshCcw,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  STAGE_LABELS,
  STAGE_ORDER,
  formatCompactCurrency,
  mapPipelineRow,
  parseLocationsQuery,
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

const FILTER_ROW_1 = [
  { value: 'high_equity', label: 'High equity' },
  { value: 'free_and_clear', label: 'Free and clear' },
  { value: 'low_equity', label: 'Low equity' },
  { value: 'negative_equity', label: 'Negative equity' },
]

const FILTER_ROW_2 = [
  { value: 'absentee_owner', label: 'Absentee owner' },
  { value: 'out_of_state_owner', label: 'Out of state owner' },
  { value: 'flipped_property', label: 'Flipped property' },
  { value: 'empty_nester', label: 'Empty nester' },
  { value: 'tired_landlord', label: 'Tired landlord' },
  { value: 'cash_buyer', label: 'Cash buyer' },
  { value: 'vacant_home', label: 'Vacant home' },
  { value: 'preforeclosure', label: 'Pre-foreclosure' },
  { value: 'bank_owned', label: 'Bank owned' },
]

const STAGE_ICONS: Record<PipelineStage, typeof SearchIcon> = {
  new_match: Sparkles,
  skip_traced: UserRound,
  conversed: MessageSquare,
  under_contract: FileText,
}

const LEAD_FILTERS = [
  { value: 'absentee_owner', label: 'Absentee Owner' },
  { value: 'high_equity', label: 'High Equity' },
  { value: 'free_and_clear', label: 'Free and Clear' },
  { value: 'vacant_home', label: 'Vacant Home' },
  { value: 'cash_buyer', label: 'Cash Buyer' },
  { value: 'preforeclosure', label: 'Pre-Foreclosure' },
  { value: 'bank_owned', label: 'Bank Owned' },
  { value: 'out_of_state_owner', label: 'Out of State Owner' },
  { value: 'low_equity', label: 'Low Equity' },
  { value: 'negative_equity', label: 'Negative Equity' },
  { value: 'flipped_property', label: 'Flipped Property' },
  { value: 'empty_nester', label: 'Empty Nester' },
  { value: 'tired_landlord', label: 'Tired Landlord' },
]

const PROPERTY_TYPE_FILTERS = [
  { value: 'SFR', label: 'Single Family', short: 'SFR' },
  { value: 'CONDO', label: 'Condo', short: 'CONDO' },
  { value: 'MFH_2_TO_4', label: 'Multifamily (2-4)', short: 'MFH' },
  { value: 'LAND', label: 'Land', short: 'LAND' },
  { value: 'TOWNHOUSE', label: 'Townhouse', short: 'TOWNHOUSE' },
  { value: 'MOBILE', label: 'Mobile Home', short: 'MOBILE' },
]

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5]
const BATHROOM_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4]

const OCCUPANCY_FILTERS = [
  { value: 'ownerOccupied', label: 'Owner Occupied' },
  { value: 'companyOwned', label: 'Company Owned' },
  { value: 'trustOwned', label: 'Trust Owned' },
  { value: 'individualOwned', label: 'Individual Owned' },
]

const FILTER_NAV_ITEMS = [
  { id: 'lead', label: 'Lead Lists' },
  { id: 'property', label: 'Property Details' },
  { id: 'owner', label: 'Owner Info & Occupancy' },
]

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

function StageRow({
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
        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
        active ? 'bg-accent/5' : 'hover:bg-muted/40'
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
          active ? 'bg-accent text-accent-foreground' : 'bg-muted text-accent/70'
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <p className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-[0.1em] text-foreground">{STAGE_LABELS[stage]}</p>
      <span className={cn('shrink-0 text-lg font-bold tabular-nums', active ? 'text-accent' : 'text-foreground')}>{count}</span>
    </button>
  )
}

interface FilterModalProps {
  activeSection: string
  setActiveSection: (section: string) => void
  selectedLeadFilters: string[]
  setSelectedLeadFilters: (next: string[]) => void
  selectedPropertyTypes: string[]
  setSelectedPropertyTypes: (next: string[]) => void
  selectedBedrooms: number[]
  setSelectedBedrooms: (next: number[]) => void
  selectedBathrooms: number[]
  setSelectedBathrooms: (next: number[]) => void
  selectedOccupancy: string[]
  setSelectedOccupancy: (next: string[]) => void
  onClose: () => void
}

function FilterModal({
  activeSection,
  setActiveSection,
  selectedLeadFilters,
  setSelectedLeadFilters,
  selectedPropertyTypes,
  setSelectedPropertyTypes,
  selectedBedrooms,
  setSelectedBedrooms,
  selectedBathrooms,
  setSelectedBathrooms,
  selectedOccupancy,
  setSelectedOccupancy,
  onClose,
}: FilterModalProps) {
  const toggleArr = (list: string[], setList: (next: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  }
  const toggleNumArr = (list: number[], setList: (next: number[]) => void, value: number) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  }
  const clearAll = () => {
    setSelectedLeadFilters([])
    setSelectedPropertyTypes([])
    setSelectedBedrooms([])
    setSelectedBathrooms([])
    setSelectedOccupancy([])
  }

  const renderLeadFilters = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-foreground">Lead Lists</h3>
      <div className="flex flex-wrap gap-2">
        {LEAD_FILTERS.map((filter) => {
          const active = selectedLeadFilters.includes(filter.value)
          return (
            <TogglePill
              key={filter.value}
              active={active}
              onClick={() => toggleArr(selectedLeadFilters, setSelectedLeadFilters, filter.value)}
            >
              {filter.label}
            </TogglePill>
          )
        })}
      </div>
    </div>
  )

  const renderPropertyDetails = () => (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-foreground">Property Details</h3>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Property Type</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROPERTY_TYPE_FILTERS.map((pt) => {
            const active = selectedPropertyTypes.includes(pt.value)
            return (
              <button
                key={pt.value}
                type="button"
                onClick={() => toggleArr(selectedPropertyTypes, setSelectedPropertyTypes, pt.value)}
                className={cn(
                  'rounded-lg border-2 px-3 py-2.5 text-center text-xs font-semibold transition-all',
                  active
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-card text-muted-foreground hover:border-accent/50 hover:text-foreground'
                )}
              >
                <span className="block text-lg font-bold">{pt.short}</span>
                <span className="block">{pt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Bedrooms</p>
        <div className="flex flex-wrap gap-2">
          {BEDROOM_OPTIONS.map((bed) => {
            const active = selectedBedrooms.includes(bed)
            return (
              <TogglePill key={bed} active={active} onClick={() => toggleNumArr(selectedBedrooms, setSelectedBedrooms, bed)}>
                {bed === 5 ? '5+' : `${bed} bed${bed === 1 ? '' : 's'}`}
              </TogglePill>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Bathrooms</p>
        <div className="flex flex-wrap gap-2">
          {BATHROOM_OPTIONS.map((bath) => {
            const active = selectedBathrooms.includes(bath)
            return (
              <TogglePill key={bath} active={active} onClick={() => toggleNumArr(selectedBathrooms, setSelectedBathrooms, bath)}>
                {bath === 4 ? '4+' : `${bath} bath${bath === 1 ? '' : 's'}`}
              </TogglePill>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderOwnerInfo = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">Owner Info & Occupancy</h3>
      <div className="space-y-2">
        {OCCUPANCY_FILTERS.map((occ) => {
          const active = selectedOccupancy.includes(occ.value)
          return (
            <TogglePill
              key={occ.value}
              active={active}
              onClick={() => toggleArr(selectedOccupancy, setSelectedOccupancy, occ.value)}
            >
              {occ.label}
            </TogglePill>
          )
        })}
      </div>
    </div>
  )

  return (
    <DialogContent className="border-2 border-border bg-card p-0 shadow-xl sm:max-w-5xl">
      <DialogHeader className="border-b border-border p-6 pb-4">
        <div className="flex items-center justify-between">
          <DialogTitle className="text-lg font-bold tracking-[0.1em] text-foreground">Filter Properties</DialogTitle>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {selectedLeadFilters.length +
            selectedPropertyTypes.length +
            selectedBedrooms.length +
            selectedBathrooms.length +
            selectedOccupancy.length}{' '}
          filter{selectedLeadFilters.length + selectedPropertyTypes.length + selectedBedrooms.length + selectedBathrooms.length + selectedOccupancy.length === 1 ? '' : 's'} active
        </p>
      </DialogHeader>
      <div className="flex h-[500px]">
        <nav className="w-1/3 min-w-[180px] border-r border-border bg-muted/30 p-4">
          <ul className="space-y-1">
            {FILTER_NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors',
                    activeSection === item.id
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <ChevronRight className="h-3 w-3 shrink-0" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="w-2/3 overflow-y-auto p-6">
          {activeSection === 'lead' && renderLeadFilters()}
          {activeSection === 'property' && renderPropertyDetails()}
          {activeSection === 'owner' && renderOwnerInfo()}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-4">
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs font-semibold">
          Clear all filters
        </Button>
        <Button size="sm" onClick={onClose} className="border-2 border-accent bg-accent text-accent-foreground hover:bg-accent/90">
          Apply filters
        </Button>
      </div>
    </DialogContent>
  )
}

export function BuyBoxPanel() {
  const [locationQuery, setLocationQuery] = useState('')
  const [propertyTypes, setPropertyTypes] = useState<string[]>([])
  const [dataLeadTypes, setDataLeadTypes] = useState<string[]>([])
  const [activeStage, setActiveStage] = useState<PipelineStage | null>(null)
  const [rows, setRows] = useState<PipelineRow[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [pipelineError, setPipelineError] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<PipelineRow | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [activeFilterSection, setActiveFilterSection] = useState('lead')

  const [selectedLeadFilters, setSelectedLeadFilters] = useState<string[]>([])
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([])
  const [selectedBedrooms, setSelectedBedrooms] = useState<number[]>([])
  const [selectedBathrooms, setSelectedBathrooms] = useState<number[]>([])
  const [selectedOccupancy, setSelectedOccupancy] = useState<string[]>([])

  const toggle = (list: string[], setList: (next: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  }

  const applyRowFilters = useCallback((sourceRows: PipelineRow[]) => {
    return sourceRows.filter((row) => {
      if (selectedLeadFilters.length > 0 && !selectedLeadFilters.some((f) => row.leadTypes.includes(f))) {
        return false
      }
      if (selectedPropertyTypes.length > 0 && !selectedPropertyTypes.includes(row.propertyType)) {
        return false
      }
      if (selectedBedrooms.length > 0 && !selectedBedrooms.includes(row.bedrooms)) {
        return false
      }
      if (selectedBathrooms.length > 0 && !selectedBathrooms.includes(row.bathrooms)) {
        return false
      }
      const occupancyFieldMap: Record<string, boolean> = {
        ownerOccupied: row.ownerOccupied,
        companyOwned: row.companyOwned,
        trustOwned: row.trustOwned,
        individualOwned: row.individualOwned !== undefined ? row.individualOwned : true,
      }
      for (const occ of selectedOccupancy) {
        if (occupancyFieldMap[occ] !== true) return false
      }
      return true
    })
  }, [selectedLeadFilters, selectedPropertyTypes, selectedBedrooms, selectedBathrooms, selectedOccupancy])

  const displayRows = useMemo(() => {
    return applyRowFilters(rows)
  }, [rows, applyRowFilters])

  /*  const loadPipeline = useCallback(async () => {
   
    const params = new URLSearchParams()
    const orConditions: string[] = []
    propertyTypes.forEach((value) => orConditions.push(`property_type.cs.{${value}}`))
    dataLeadTypes.forEach((value) => orConditions.push(`lead_types.cs.{${value}}`))
    if (orConditions.length > 0) {
      params.append('or', `(${orConditions.join(',')})`)
    }
    if (activeStage) params.set('stage', `eq.${activeStage}`)
    try {
      const response = await fetch(`/api/buybox/pipeline?${params.toString()}`, { cache: 'no-store' })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error ?? `Pipeline request failed (${response.status})`)
      }
      const payload = await response.json().catch(() => ("Error pushed"))
      const mapped =  [payload].map(mapPipelineRow)
      setRows(mapped)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Buy Box pipeline could not be reached.'
      setPipelineError(message)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [propertyTypes, dataLeadTypes, activeStage])

  useEffect(() => {
    void loadPipeline()
  }, [loadPipeline])
*/
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
    setLoading(true)
    try {
      const { cities, states, zips } = parseLocationsQuery(locationQuery)
      const response = await fetch('/api/buybox/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cities,
          states,
          zips,
          leadTypes: dataLeadTypes,
          propertyTypes,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setSearchError(data?.error ?? 'Buy Box search could not be reached.')
        return
      }

      const results = data?.results ?? []
      const mapped = results.map(mapPipelineRow)
      setRows(mapped)
      setLoading(false)

    } catch {
      setSearchError('Buy Box search could not be reached.')
    } finally {
      setSearching(false)
      setLoading(false)
    }
  }

  console.log("Rows:",rows)

  function openRow(row: PipelineRow) {
    setSelectedRow(row)
    setDrawerOpen(true)
  }

  const anyFilterActive =
    propertyTypes.length > 0 || dataLeadTypes.length > 0 || activeStage !== null

  const anyModalFilterActive =
    selectedLeadFilters.length > 0 || selectedPropertyTypes.length > 0 || selectedBedrooms.length > 0 || selectedBathrooms.length > 0 || selectedOccupancy.length > 0

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: search bar + location example pills */}
      <div className="border-b border-border pb-4">
        <div className="rounded-2xl border-2 border-dashed border-border bg-background/50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
              <input
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) void runSearch()
                }}
                placeholder="Search locations..."
                className="w-full rounded-xl border-2 border-border bg-card py-2.5 pl-10 pr-3 text-sm placeholder:text-muted-foreground/70 focus:border-accent focus:outline-none transition-colors"
              />
            </div>
            <Button onClick={runSearch} disabled={searching || !locationQuery.trim()} className="shrink-0 rounded-xl border-2 border-accent bg-accent text-accent-foreground hover:bg-accent/90">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" data-icon="inline-start" /> : <SearchIcon data-icon="inline-start" />}
              Search Buy Box
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {LOCATION_EXAMPLES.map((example) => (
              <span key={example} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-accent/50 hover:text-foreground cursor-pointer transition-colors">
                {example}
              </span>
            ))}
          </div>
          {searchError && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
              <span className="flex-1">{searchError}</span>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={runSearch}>
                <RefreshCcw className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: filters split into two rows */}
      <div className="border-b border-border pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-accent" />
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Filter matches</p>
            {anyFilterActive && (
              <button
                onClick={() => { setPropertyTypes([]); setActiveStage(null) }}
                className="ml-auto text-[11px] font-medium text-accent hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Ownership</p>
            <span className="mx-1 my-auto h-4 w-px bg-border" />
            {FILTER_ROW_1.map((option) => (
              <TogglePill key={option.value} active={dataLeadTypes.includes(option.value)} onClick={() => toggle(dataLeadTypes, setDataLeadTypes, option.value)}>
                {option.label}
              </TogglePill>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Add Ons</p>
            <span className="mx-1 my-auto h-4 w-px bg-border" />
            {FILTER_ROW_2.map((option) => (
              <TogglePill key={option.value} active={dataLeadTypes.includes(option.value)} onClick={() => toggle(dataLeadTypes, setDataLeadTypes, option.value)}>
                {option.label}
              </TogglePill>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: stages + fetched properties as plain columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <div className="flex flex-col lg:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Pipeline stages</p>
            {activeStage && (
              <button onClick={() => setActiveStage(null)} className="text-[11px] font-medium text-accent hover:underline">
                Clear
              </button>
            )}
          </div>
          <div className="mt-2 overflow-hidden rounded-lg border border-border">
            {STAGE_ORDER.map((stage) => (
              <StageRow
                key={stage}
                stage={stage}
                count={grouped[stage].length}
                active={activeStage === stage}
                onClick={() => setActiveStage(activeStage === stage ? null : stage)}
              />
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-col lg:col-span-6">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <MapPin className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold">Fetched properties</p>
            <span className="ml-auto text-xs text-muted-foreground">{displayRows.length} results</span>
            {rows.length > 0 && (
              <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
                <DialogTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-7 gap-1.5 border-2 border-border text-xs font-semibold',
                      anyModalFilterActive ? 'border-accent bg-accent/10 text-accent' : 'text-muted-foreground hover:border-accent/50 hover:text-foreground'
                    )}
                  >
                    <Filter className="h-3 w-3" />
                    Filter
                  </Button>
                </DialogTrigger>
                <FilterModal
                  activeSection={activeFilterSection}
                  setActiveSection={setActiveFilterSection}
                  selectedLeadFilters={selectedLeadFilters}
                  setSelectedLeadFilters={setSelectedLeadFilters}
                  selectedPropertyTypes={selectedPropertyTypes}
                  setSelectedPropertyTypes={setSelectedPropertyTypes}
                  selectedBedrooms={selectedBedrooms}
                  setSelectedBedrooms={setSelectedBedrooms}
                  selectedBathrooms={selectedBathrooms}
                  setSelectedBathrooms={setSelectedBathrooms}
                  selectedOccupancy={selectedOccupancy}
                  setSelectedOccupancy={setSelectedOccupancy}
                  onClose={() => setFilterModalOpen(false)}
                />
              </Dialog>
            )}
          </div>
          <div className="max-h-[32rem] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading Buy Box matches…
              </div>
            ) : pipelineError ? (
              <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center text-sm text-destructive">
                <p>{pipelineError}</p>
                <Button variant="outline" size="sm" onClick={runSearch}>
                  <RefreshCcw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Search a location above to pull matching properties into your Buy Box.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Property</th>
                    <th className="px-4 py-2 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => (
                    <tr
                      key={row.propertyLeadId}
                      onClick={() => openRow(row)}
                      className="cursor-pointer border-b border-border/60 last:border-b-0 hover:bg-muted/60"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.address || 'Unknown address'}</p>
                        <p className="text-xs text-muted-foreground">{[row.city, row.state, row.zip].filter(Boolean).join(', ')}</p>
                         <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                           <Building2 className="h-3 w-3" />
                           {row.propertyType || '—'}
                         </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{formatCompactCurrency(row.estimatedValue)}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {row.leadTypes.map((lt) => (
                            <span key={lt} className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                              {lt.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
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
