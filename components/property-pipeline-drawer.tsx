'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Bath,
  BedDouble,
  Building2,
  DollarSign,
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
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SkipTraceResults } from '@/components/skiptrace-results'
import { cn } from '@/lib/utils'
import { submitLead, type LeadKind } from '@/lib/leads'
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

function FinancialsTab({ row, onFindComparables, comparablesState, comparables }: {
  row: PipelineRow
  onFindComparables: () => void
  comparablesState: 'idle' | 'loading' | 'done' | 'error'
  comparables: PipelineRow[]
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
    { label: 'Comps used', value: String(comparables.length) },
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
      <Button variant="outline" className="w-full" onClick={onFindComparables} disabled={comparablesState === 'loading'}>
        {comparablesState === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" data-icon="inline-start" /> : <SearchIcon data-icon="inline-start" />}
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
      const ownerName = row.ownerName.trim().toUpperCase()
      const cityStateZip = [row.city, row.state, row.zip].filter(Boolean).join(', ')
      const ownershipType = row.companyOwned ? 'company' : row.trustOwned ? 'trust' : 'individual'
      const response = await fetch('https://maligroup.xyz/webhook/48a1fe91-02f2-42dc-928c-526767e35b00', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "max_results": 1,
          "name": [ `${ownerName};${cityStateZip}`],
          "street_citystatezip": [ row.address,`${cityStateZip}`]

        }),
      })
      
      const payload = await response.json()
      console.log('payload:', payload)
      if (!response.ok) {
        setErrorMessage('Skip trace workflow could not be reached.')
        setState('error')
        return
      }
      setResult(payload)
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
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (row) {
      setStage(row.stage)
      setComparablesState('idle')
      setComparables([])
    }
  }, [row?.propertyLeadId])

  if (!row) return null
  const address = fullAddress(row)
  const hasCoordinates = Number.isFinite(row.latitude) && Number.isFinite(row.longitude) && (row.latitude !== 0 || row.longitude !== 0)

  async function findComparables() {
    const currentRow = row
    if (!currentRow) return
    setComparablesState('loading')
    const params = new URLSearchParams()
    if (currentRow.city) params.set('city', currentRow.city)
    if (currentRow.state) params.set('state', currentRow.state)
    const response = await fetch(`/api/buybox/pipeline?${params.toString()}`, { cache: 'no-store' })
    const payload = await response.json().catch(() => ({ rows: [] }))
    const rows = Array.isArray(payload.rows)
      ? payload.rows.filter((item: Record<string, unknown>) => Number(item.property_lead_id) !== currentRow.propertyLeadId)
      : []
    setComparables(rows.map((item: Record<string, unknown>) => ({
      propertyLeadId: Number(item.property_lead_id),
      address: String(item.address ?? ''),
      city: String(item.city ?? ''),
      state: String(item.state ?? ''),
      zip: String(item.zip ?? ''),
      estimatedValue: Number(item.estimated_value ?? 0),
      propertyType: String(item.property_type ?? ''),
    })).slice(0, 6))
    setComparablesState('done')
  }

  const leadKind: LeadKind = row.companyOwned ? 'buyer' : 'seller'

  async function handleSubmit() {
    const currentRow = row
    if (!currentRow) return
    setSubmitting(true)
    try {
      await submitLead(currentRow)
      onOpenChange(false)
      setSuccessMessage('Property successfully added.')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch {
      // error handling could be added here
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <span>{address}</span>
          </SheetTitle>
          <SheetDescription>
            {row.propertyType || 'Property'} · {formatCurrency(row.estimatedValue)}
          </SheetDescription>
        </SheetHeader>

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
              <FinancialsTab row={row} onFindComparables={findComparables} comparablesState={comparablesState} comparables={comparables} />
            )}
            {stage === 'skip_traced' && <SkipTraceTab row={row} />}
            {stage === 'conversed' && <ConversedTab row={row} />}
            {stage === 'under_contract' && <ContractsTab row={row} />}
          </div>
        </div>
      </SheetContent>
      </Sheet>
      {successMessage && (
        <div
          role="status"
          className="fixed right-6 top-6 z-[60] rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-300 shadow-lg"
        >
          {successMessage}
        </div>
      )}
    </>
  )
}
