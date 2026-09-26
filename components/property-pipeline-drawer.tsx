'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Bath,
  BedDouble,
  Building2,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search as SearchIcon,
  Send,
  Sparkles,
  Upload,
  UserRound,
  School,
  Shield,
  Calendar,
  TrendingUp,
  BarChart3,
  FileImage,
  Tag,
  Home,
  Check,
  ExternalLink,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SkipTraceResults } from '@/components/skiptrace-results'
import { cn } from '@/lib/utils'
import { submitLead, type LeadKind } from '@/lib/leads'
import { useToast } from '@/hooks/use-toast'
import {
  computeFinancials,
  formatCurrency,
  STAGE_LABELS,
  STAGE_ORDER,
  type PipelineRow,
  type PipelineStage,
} from '@/lib/buybox'

interface ConversationRecord {
  id: number
  occurred_at: string
  channel: string | null
  summary: string
  outcome: string | null
  next_step: string | null
}

interface ContractRecord {
  id: number
  file_name: string | null
  file_type: string | null
  sent: boolean
  replied: boolean
  is_reply: boolean
  seller_name: string | null
  notes: string | null
  created_at: string
  signed_url: string | null
}

const PropertyLocationMap = dynamic(
  () => import('@/components/property-location-map').then((mod) => mod.PropertyLocationMap),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading map…</div> }
)

const STAGE_ICONS: Record<PipelineStage, typeof SearchIcon> = {
  new_match: Sparkles,
  skip_traced: UserRound,
  conversed: MessageSquare,
  under_contract: FileText,
}

function fullAddress(row: PipelineRow) {
  return [row.address, row.city, row.state, row.zip].filter(Boolean).join(', ')
}

interface PriceHistoryEntry {
  date: string | null
  event: string
  price: number | null
  pricePerSquareFoot: number | null
  priceChangeRate: number
  source: string | null
}

interface TaxHistoryEntry {
  year: number
  taxPaid: number | null
  taxIncreaseRate: number
  assessedValue: number | null
  valueIncreaseRate: number
}

interface SchoolInfo {
  name: string
  rating: number | null
  level: string | null
  grades: string | null
  schoolType: string | null
  distanceMiles: number | null
  link: string | null
}

interface ComparableHome {
  zpid: number | null
  zillowUrl: string | null
  streetAddress: string | null
  city: string | null
  state: string | null
  zipcode: string | null
  price: number | null
  currency: string | null
  bedrooms: number | null
  bathrooms: number | null
  livingArea: number | null
  homeStatus: string | null
  homeType: string | null
  latitude: number | null
  longitude: number | null
}

interface RiskScore {
  value: number
  min: number
  max: number
  label: string
}

interface ClimateRiskCategory {
  riskScore: RiskScore
  riskGrowth: string | null
  femaZone: string | null
  insuranceRecommendation: string | null
}

interface ClimateRisk {
  flood: ClimateRiskCategory
  fire: ClimateRiskCategory
  heat: ClimateRiskCategory
  wind: ClimateRiskCategory
  air: ClimateRiskCategory
}

interface ZillowEnrichmentData {
  zpid: number | null
  zillowUrl: string | null
  streetAddress: string | null
  city: string | null
  state: string | null
  zipcode: string | null
  price: number | null
  zestimate: number | null
  rentZestimate: number | null
  lastSoldPrice: number | null
  currency: string | null
  homeStatus: string | null
  homeType: string | null
  bedrooms: number | null
  bathrooms: number | null
  livingArea: number | null
  livingAreaUnits: string | null
  lotAreaValue: number | null
  lotAreaUnits: string | null
  yearBuilt: number | null
  daysOnZillow: number | null
  datePosted: string | null
  monthlyHoaFee: number | null
  propertyTaxRate: number | null
  annualHomeownersInsurance: number | null
  agentName: string | null
  agentPhoneNumber: string | null
  agentEmail: string | null
  agentLicenseNumber: string | null
  brokerName: string | null
  brokerPhoneNumber: string | null
  coAgentName: string | null
  coAgentPhoneNumber: string | null
  brokerageName: string | null
  mlsId: string | null
  mlsName: string | null
  priceHistory: PriceHistoryEntry[]
  taxHistory: TaxHistoryEntry[]
  schools: SchoolInfo[]
  comparableHomes: ComparableHome[]
  climateRisk: ClimateRisk
  propertyDescription: string | null
  photoCount: number
  photoUrls: string[]
  hiResImageLink: string | null
  pageViewCount: number
  favoriteCount: number
  county: string | null
  parcelId: string | null
  latitude: number | null
  longitude: number | null
  scrapedAt: string | null
}

function ZillowPropertyDetails({ data }: { data: ZillowEnrichmentData }) {
  return (
    <div className="space-y-6">
      {data.photoUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {data.photoUrls.slice(0, 6).map((url, idx) => (
            <img key={idx} src={url} alt={`Property photo ${idx + 1}`} className="rounded-lg border border-border object-cover aspect-video" />
          ))}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Property Overview</p>
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          <DetailRow label="Zillow ID" value={data.zpid?.toString() ?? 'N/A'} />
          <DetailRow label="Price" value={data.price ? formatCurrency(data.price) : 'N/A'} />
          <DetailRow label="Zestimate" value={data.zestimate ? formatCurrency(data.zestimate) : 'N/A'} />
          <DetailRow label="Rent Zestimate" value={data.rentZestimate ? formatCurrency(data.rentZestimate) : 'N/A'} />
          <DetailRow label="Status" value={data.homeStatus ?? 'N/A'} />
          <DetailRow label="Type" value={data.homeType ?? 'N/A'} />
          <DetailRow label="Bedrooms" value={data.bedrooms?.toString() ?? 'N/A'} />
          <DetailRow label="Bathrooms" value={data.bathrooms?.toString() ?? 'N/A'} />
          <DetailRow label="Living Area" value={data.livingArea ? `${data.livingArea} ${data.livingAreaUnits ?? ''}`.trim() : 'N/A'} />
          <DetailRow label="Lot Area" value={data.lotAreaValue ? `${data.lotAreaValue} ${data.lotAreaUnits ?? ''}`.trim() : 'N/A'} />
          <DetailRow label="Year Built" value={data.yearBuilt?.toString() ?? 'N/A'} />
          <DetailRow label="Days on Zillow" value={data.daysOnZillow?.toString() ?? 'N/A'} />
          <DetailRow label="Date Posted" value={data.datePosted ?? 'N/A'} />
        </div>
      </div>

      {data.priceHistory.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Price History</p>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {data.priceHistory.map((entry, idx) => (
              <DetailRow key={idx} label={entry.date ?? 'N/A'} value={formatCurrency(entry.price ?? 0)} />
            ))}
          </div>
        </div>
      )}

      {data.taxHistory.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tax History</p>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {data.taxHistory.map((entry, idx) => (
              <DetailRow key={idx} label={entry.year?.toString() ?? 'N/A'} value={formatCurrency(entry.taxPaid ?? 0)} />
            ))}
          </div>
        </div>
      )}

      {data.schools.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Nearby Schools</p>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {data.schools.map((school, idx) => (
              <div key={idx} className="flex flex-col gap-0.5 px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{school.name ?? 'N/A'}</span>
                  {school.rating !== null && (
                    <Badge variant="outline" className="text-xs">{school.rating}/10</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{school.level ?? 'N/A'} · {school.distanceMiles?.toString() ?? 'N/A'} mi</span>
                <span className="text-xs text-muted-foreground">{school.grades ?? 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Climate Risk</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <ClimateRiskCard label="Flood" category={data.climateRisk.flood} />
          <ClimateRiskCard label="Fire" category={data.climateRisk.fire} />
          <ClimateRiskCard label="Heat" category={data.climateRisk.heat} />
          <ClimateRiskCard label="Wind" category={data.climateRisk.wind} />
          <ClimateRiskCard label="Air" category={data.climateRisk.air} />
        </div>
      </div>

      {data.comparableHomes.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Comparable Homes</p>
          <div className="space-y-2">
            {data.comparableHomes.map((comp, idx) => (
              <div key={idx} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{comp.streetAddress ?? 'N/A'}</p>
                  {comp.price && <span className="text-sm font-semibold">{formatCurrency(comp.price)}</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {comp.city ?? ''}, {comp.state ?? ''} {comp.zipcode ?? ''}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {comp.bedrooms ?? 0} bd · {comp.bathrooms ?? 0} ba · {comp.livingArea ?? 0} sqft
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(data.agentName || data.brokerName || data.mlsName) && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Agent & MLS Info</p>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {data.agentName && <DetailRow label="Agent" value={data.agentName} />}
            {data.agentPhoneNumber && <DetailRow label="Agent Phone" value={data.agentPhoneNumber} />}
            {data.brokerName && <DetailRow label="Broker" value={data.brokerName} />}
            {data.brokerPhoneNumber && <DetailRow label="Broker Phone" value={data.brokerPhoneNumber} />}
            {data.mlsName && <DetailRow label="MLS" value={data.mlsName} />}
            {data.mlsId && <DetailRow label="MLS ID" value={data.mlsId} />}
          </div>
        </div>
      )}

      {data.propertyDescription && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Property Description</p>
          <p className="text-sm text-muted-foreground rounded-lg border border-border bg-card p-3">
            {data.propertyDescription}
          </p>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function ClimateRiskCard({ label, category }: { label: string; category: ClimateRiskCategory }) {
  const riskLevel = category?.riskScore?.label ?? 'Unknown'
  const riskScore = category?.riskScore?.value
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{riskLevel}</p>
      {riskScore !== null && riskScore !== undefined && (
        <p className="text-xs text-muted-foreground">Score: {riskScore}</p>
      )}
    </div>
  )
}

function FinancialsTab({ row, onFindComparables, comparablesState, comparables, zillowData, zillowLoading }: {
  row: PipelineRow
  onFindComparables: () => void
  comparablesState: 'idle' | 'loading' | 'done' | 'error'
  comparables: PipelineRow[]
  zillowData: ZillowEnrichmentData | null
  zillowLoading: boolean
}) {
  const financials = computeFinancials({
    estimatedValue: row.estimatedValue,
    lastSoldPrice: row.lastSoldPrice,
    squareFeet: row.livingAreaSf,
    yearBuilt: row.yearBuilt,
    taxAssessedTotal: 0,
  })
  const rows: { label: string; value: string }[] = [
    { label: 'Offr AI model', value: 'List' },
    { label: 'List', value: row.mlsStatus ? 'On market' : 'Off market' },
    { label: 'Market value', value: formatCurrency(row.estimatedValue) },
    { label: 'ARV (est)', value: formatCurrency(financials.arv) },
    { label: 'Repairs est', value: formatCurrency(financials.repairEstimate) },
    { label: 'MAO', value: formatCurrency(financials.maxAllowableOffer) },
    { label: 'Comps used', value: String(zillowData?.comparableHomes?.length ?? comparables.length) },
  ]
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Financials</p>
        <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
          {rows.map((item) => (
            <div key={item.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={onFindComparables} disabled={comparablesState === 'loading' || zillowLoading}>
        {comparablesState === 'loading' || zillowLoading ? <Loader2 className="h-4 w-4 animate-spin" data-icon="inline-start" /> : <SearchIcon data-icon="inline-start" />}
        Show comparable options nearby
      </Button>
      {comparablesState === 'done' && (
        <div className="space-y-2">
          {comparables.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              No other Buy Box matches found in this neighborhood yet.
            </p>
          )}
          {comparables.map((comp) => (
            <div key={comp.propertyLeadId} className="rounded-lg border border-border bg-card p-3 text-sm">
              <p className="font-medium">{comp.address}</p>
              <p className="text-xs text-muted-foreground">{comp.city}, {comp.state} {comp.zip}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(comp.estimatedValue)} · {comp.propertyType || 'Unknown type'}</p>
            </div>
          ))}
        </div>
      )}
      {zillowData && (
        <div className="pt-2">
          <ZillowPropertyDetails data={zillowData} />
        </div>
      )}
    </div>
  )
}

function SkipTraceTab({ row }: { row: PipelineRow }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>(row.skiptraceId ? 'done' : 'idle')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showContacts, setShowContacts] = useState(false)

  console.log("row:",row)



  useEffect(() => {
    if (!row.skiptraceId) return
    void fetch(`/api/leads/trigger?property_lead_id=${row.propertyLeadId}&source_id=${encodeURIComponent(String(row.sourceId ?? ''))}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => { if (payload?.result) setResult(payload.result) })
      .catch(() => null)
  }, [row.propertyLeadId, row.skiptraceId, row.sourceId])

  async function runSkipTrace() {
    setState('loading')
    setErrorMessage(null)
    try {
      const response = await fetch('/api/leads/skiptrace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: row.address,
          city: row.city,
          state: row.state,
          zip: row.zip,
          ownerName: row.ownerName
        }),
      })
      
      const payload = await response.json()
      console.log('payload:', payload)
      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error || 'Skip trace failed')
        setState('error')
        return
      }
      setResult(payload.rawData)
      setState('done')
    } catch (error) {
      setErrorMessage('Skip trace workflow could not be reached.')
      console.log('Error:', error)
      setState('error')
    }
  }

    console.log ("result:",result)

  function extractContacts(result: Record<string, unknown> | null) {
    if (!result || typeof result !== 'object') return { phones: [], emails: [] }
    const record = result as Record<string, unknown>
    const phones: { value: string; type: string; provider: string; lastReported: string }[] = []
    const emails: string[] = []

    for (let i = 1; i <= 10; i++) {
      const phoneKey = `Phone-${i}`
      const emailKey = `Email-${i}`
      const phoneTypeKey = `Phone-${i}_Type`
      const phoneProviderKey = `Phone-${i}_Provider`
      const phoneLastReportedKey = `Phone-${i}_Last_Reported`

      const phoneValue = typeof record[phoneKey] === 'string' ? (record[phoneKey] as string) : ''
      const emailValue = typeof record[emailKey] === 'string' ? (record[emailKey] as string) : ''

      if (phoneValue) {
        phones.push({
          value: phoneValue,
          type: typeof record[phoneTypeKey] === 'string' ? (record[phoneTypeKey] as string) : '',
          provider: typeof record[phoneProviderKey] === 'string' ? (record[phoneProviderKey] as string) : '',
          lastReported: typeof record[phoneLastReportedKey] === 'string' ? (record[phoneLastReportedKey] as string) : '',
        })
      }
      if (emailValue) {
        emails.push(emailValue)
      }
    }

    return { phones, emails }
  }

  const contacts = result ? extractContacts(result) : { phones: [], emails: [] }

  return (
    <div className="space-y-4">
      {state === 'idle' && (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          No skip trace has been run for this lead yet.
        </div>
      )}
      <Button onClick={runSkipTrace} disabled={state === 'loading'} className="w-full">
        {state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" data-icon="inline-start" /> : <UserRound data-icon="inline-start" />}
        {row.skiptraceId ? 'Re-run skip trace' : 'Run skip trace'}
      </Button>
      {state === 'error' && <p className="text-sm text-destructive">{errorMessage ?? 'Skip trace workflow could not be reached.'}</p>}
      {result && <SkipTraceResults result={result} />}

      {contacts.phones.length > 0 || contacts.emails.length > 0 ? (
        <Button variant="outline" className="w-full" onClick={() => setShowContacts(true)}>
          <Phone data-icon="inline-start" />
          Show Contacts ({contacts.phones.length + contacts.emails.length})
        </Button>
      ) : state === 'done' ? (
        <p className="text-xs text-muted-foreground text-center py-2">No contacts found for this lead.</p>
      ) : null}

      <Sheet open={showContacts} onOpenChange={setShowContacts}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Contact Information</SheetTitle>
            <SheetDescription>
              {row.ownerName} · {row.address}, {row.city}, {row.state} {row.zip}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6 px-4 pb-6">
            {contacts.phones.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">Phone Numbers</p>
                <div className="space-y-2">
                  {contacts.phones.map((phone, index) => (
                    <a
                      key={index}
                      href={`tel:${phone.value.replace(/[^\d+]/g, '')}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm hover:border-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">{phone.value}</p>
                          {phone.type && <p className="text-xs text-muted-foreground">{phone.type}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        {phone.provider && <p className="text-xs text-muted-foreground">{phone.provider}</p>}
                        {phone.lastReported && <p className="text-[10px] text-muted-foreground">{phone.lastReported}</p>}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {contacts.emails.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">Email Addresses</p>
                <div className="space-y-2">
                  {contacts.emails.map((email, index) => (
                    <a
                      key={index}
                      href={`mailto:${email}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm hover:border-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="break-all">{email}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {contacts.phones.length === 0 && contacts.emails.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No contact information available.</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ConversedTab({ row }: { row: PipelineRow }) {
  const [conversations, setConversations] = useState<ConversationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [summary, setSummary] = useState('')
  const [channel, setChannel] = useState('')
  const [outcome, setOutcome] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const response = await fetch(`/api/buybox/conversations?property_lead_id=${row.propertyLeadId}`, { cache: 'no-store' })
    const payload = await response.json().catch(() => ({ rows: [] }))
    setConversations(Array.isArray(payload.rows) ? payload.rows : [])
    setLoading(false)
  }

  useEffect(() => { void load() }, [row.propertyLeadId])

  async function submit() {
    if (!summary.trim()) return
    setSubmitting(true)
    await fetch('/api/buybox/conversations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ property_lead_id: row.propertyLeadId, summary, channel: channel || null, outcome: outcome || null }),
    })
    setSummary('')
    setChannel('')
    setOutcome('')
    setShowForm(false)
    setSubmitting(false)
    void load()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        This stage is still under development. Some features may not work as expected.
      </div>
      {conversations.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          No conversations have been recorded with this seller yet.
        </div>
      )}
      <div className="space-y-2">
        {conversations.map((conversation) => (
          <div key={conversation.id} className="rounded-lg border border-border bg-card p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{conversation.channel || 'Conversation'}</span>
              <span className="text-xs text-muted-foreground">{new Date(conversation.occurred_at).toLocaleString()}</span>
            </div>
            <p className="mt-1.5 text-muted-foreground">{conversation.summary}</p>
            {conversation.outcome && <p className="mt-1 text-xs text-muted-foreground">Outcome: {conversation.outcome}</p>}
          </div>
        ))}
      </div>
      {showForm ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              placeholder="Channel (call, text, email)"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              placeholder="Outcome (optional)"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Summarize what was discussed with the seller…"
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={submit} disabled={submitting || !summary.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" data-icon="inline-start" /> : <MessageSquare data-icon="inline-start" />}
              Save conversation
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
          <MessageSquare data-icon="inline-start" />
          {conversations.length ? 'Log another conversation' : 'Record a conversation'}
        </Button>
      )}
    </div>
  )
}

function ContractsTab({ row }: { row: PipelineRow }) {
  const [contracts, setContracts] = useState<ContractRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [mode, setMode] = useState<'send' | 'reply' | null>(null)

  async function load() {
    setLoading(true)
    const response = await fetch(`/api/buybox/contracts?property_lead_id=${row.propertyLeadId}`, { cache: 'no-store' })
    const payload = await response.json().catch(() => ({ rows: [] }))
    setContracts(Array.isArray(payload.rows) ? payload.rows : [])
    setLoading(false)
  }

  useEffect(() => { void load() }, [row.propertyLeadId])

  async function upload(file: File, isReply: boolean) {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('property_lead_id', String(row.propertyLeadId))
    formData.append('is_reply', String(isReply))
    await fetch('/api/buybox/contracts', { method: 'POST', body: formData })
    setUploading(false)
    setMode(null)
    void load()
  }

  const latestSent = contracts.find((contract) => !contract.is_reply)
  const latestReply = contracts.find((contract) => contract.is_reply)
  const state = latestReply ? 'replied' : latestSent ? 'sent' : 'none'

  if (loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading contract status…</div>

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        This stage is still under development. Some features may not work as expected.
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
        <span className={cn(
          'h-2 w-2 rounded-full',
          state === 'replied' ? 'bg-[oklch(0.70_0.18_155)]' : state === 'sent' ? 'bg-accent' : 'bg-muted-foreground/40'
        )} />
        <span className="text-sm font-medium">
          {state === 'replied' ? 'Contract sent — seller replied' : state === 'sent' ? 'Contract sent — awaiting reply' : 'No contract sent yet'}
        </span>
      </div>
      <div className="space-y-2">
        {contracts.map((contract) => (
          <a
            key={contract.id}
            href={contract.signed_url || '#'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm hover:border-accent/50"
          >
            <span className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-accent" />
              <span className="truncate">{contract.file_name || 'Contract file'}</span>
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">{contract.is_reply ? 'Reply' : 'Sent'}</span>
          </a>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={cn('flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-accent/60 px-4 py-2.5 text-sm font-semibold hover:border-accent', uploading && 'pointer-events-none opacity-50')}>
          <Send className="h-4 w-4" />
          {latestSent ? 'Send new contract' : 'Send contract'}
          <input type="file" accept=".pdf,image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file, false) }} />
        </label>
        <label className={cn('flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-border px-4 py-2.5 text-sm font-semibold hover:border-accent/50', uploading && 'pointer-events-none opacity-50')}>
          <Upload className="h-4 w-4" />
          Upload seller reply
          <input type="file" accept=".pdf,image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file, true) }} />
        </label>
      </div>
      {uploading && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Uploading…</p>}
    </div>
  )
}

export function PropertyPipelineDrawer({ row, open, onOpenChange }: {
  row: PipelineRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [stage, setStage] = useState<PipelineStage>('new_match')
  const [comparablesState, setComparablesState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [comparables, setComparables] = useState<PipelineRow[]>([])
  const [zillowData, setZillowData] = useState<ZillowEnrichmentData | null>(null)
  const [zillowLoading, setZillowLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { showToast } = useToast()

  useEffect(() => {
    if (row) {
      setStage(row.stage)
      setComparablesState('idle')
      setComparables([])
      setZillowData(null)
    }
  }, [row?.propertyLeadId])

  if (!row) return null
  const address = fullAddress(row)
  const hasCoordinates = Number.isFinite(row.latitude) && Number.isFinite(row.longitude) && (row.latitude !== 0 || row.longitude !== 0)
  
  async function findComparables() {
    const currentRow = row
    if (!currentRow) return
    setComparablesState('loading')
    setZillowLoading(true)
    try {
      const address = fullAddress(currentRow)
      const response = await fetch('/api/buybox/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: [address],
          includeClimateRisk: true,
          includeComparableHomes: true,
          includeZestimateHistory: true,
        }),
      })
      const payload = await response.json().catch(() => ({ ok: false, results: [] }))
      const results = Array.isArray(payload.results) ? payload.results : []
      if (results.length > 0) {
        const data = results[0] as ZillowEnrichmentData
        setZillowData(data)
        setComparables((data.comparableHomes ?? []).map((comp: any): PipelineRow => ({
          propertyLeadId: comp.zpid ?? 0,
          sourceId: null,
          address: comp.streetAddress ?? '',
          city: comp.city ?? '',
          state: comp.state ?? '',
          zip: comp.zipcode ?? '',
          propertyType: comp.homeType ?? '',
          bedrooms: comp.bedrooms ?? 0,
          bathrooms: comp.bathrooms ?? 0,
          livingAreaSf: comp.livingArea ?? 0,
          yearBuilt: 0,
          estimatedValue: comp.price ?? 0,
          estimatedEquity: 0,
          estimatedEquityPercentage: 0,
          lastSoldPrice: 0,
          lastSoldDate: '',
          mlsStatus: '',
          daysOnMarket: 0,
          leadTypes: [],
          ownerName: '',
          ownerOccupied: false,
          companyOwned: false,
          individualOwned: true,
          trustOwned: false,
          latitude: comp.latitude ?? 0,
          longitude: comp.longitude ?? 0,
          createdAt: '',
          skiptraceId: null,
          skiptracedAt: null,
          conversationCount: 0,
          lastConversationAt: null,
          contractCount: 0,
          anySent: false,
          anyReplied: false,
          stage: 'new_match',
          status: '',
          notesCount: 0,
          lastNoteAt: null,
        })).slice(0, 6))
      }
      setComparablesState('done')
    } catch {
      setComparablesState('error')
    } finally {
      setZillowLoading(false)
    }
  }

  
  const leadKind: LeadKind = row.companyOwned ? 'buyer' : 'seller'

  async function handleSubmit() {
    const currentRow = row
    if (!currentRow) return
    setSubmitting(true)
    try {
      await submitLead(currentRow)
      onOpenChange(false)
      showToast({ type: 'success', title: 'Property successfully added to database.' })
    } catch (error: any) {
      if (error?.status === 409 || (error?.message && error.message.includes('409'))) {
        showToast({ type: 'warning', title: 'Property already in database.' })
      } else {
        showToast({ type: 'error', title: 'Failed to add property.', message: error?.message ?? 'Unknown error' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col gap-0 p-0"
      >
        <DialogHeader className="px-6 py-5">
          <DialogTitle className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <span>{address}</span>
          </DialogTitle>
          <DialogDescription>
            {row.propertyType || 'Property'} · {formatCurrency(row.estimatedValue)}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pt-3 pb-2">
          <Button
            variant="default"
            size="sm"
            className="w-full rounded-lg border-2 border-accent bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" data-icon="inline-start" />
            ) : (
              <Send data-icon="inline-start" />
            )}
            {submitting ? 'Submitting…' : `Save as ${leadKind} lead`}
          </Button>
        </div>

        <div className="mt-4 space-y-5 px-4 pb-6">
          <div className="h-56 overflow-hidden rounded-xl border border-border bg-muted">
            {hasCoordinates ? (
              <PropertyLocationMap latitude={row.latitude} longitude={row.longitude} address={address} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Location coordinates unavailable</div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[
              { icon: BedDouble, value: row.bedrooms || '—' },
              { icon: Bath, value: row.bathrooms || '—' },
              { icon: Building2, value: row.propertyType || '—' },
            ].map((stat, index) => (
              <div key={index} className="col-span-2 flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-xs">
                <stat.icon className="h-3.5 w-3.5 text-accent" />
                <span className="truncate font-medium">{stat.value}</span>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Pipeline</p>
            <div className="flex flex-wrap gap-2">
              {STAGE_ORDER.map((item) => {
                const Icon = STAGE_ICONS[item]
                const active = stage === item
                const underDevelopment = item === 'conversed' || item === 'under_contract'
                return (
                  <button
                    key={item}
                    onClick={() => setStage(item)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-colors',
                      active ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground',
                      underDevelopment && !active && 'border-dashed'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {STAGE_LABELS[item]}
                    {underDevelopment && <span className="text-[9px] uppercase tracking-wider opacity-70">(dev)</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            {stage === 'new_match' && (
              <FinancialsTab row={row} onFindComparables={findComparables} comparablesState={comparablesState} comparables={comparables} zillowData={zillowData} zillowLoading={zillowLoading} />
            )}
            {stage === 'skip_traced' && <SkipTraceTab row={row} />}
            {stage === 'conversed' && <ConversedTab row={row} />}
            {stage === 'under_contract' && <ContractsTab row={row} />}
          </div>
          </div>
          <div className="pb-6" />
        </DialogContent>
      </Dialog>
    </>
  )
}
