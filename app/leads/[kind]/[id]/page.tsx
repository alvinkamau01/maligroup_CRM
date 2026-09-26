'use client'

import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { ArrowLeft, Bath, BedDouble, Building2, DollarSign, Home, Loader2, MapPin, Ruler, Sparkles, UserRound } from 'lucide-react'
import { fetchLeads, type LeadKind } from '@/lib/leads'
import { PropertyLocationMap } from '@/components/property-location-map'
import { SkipTraceResults } from '@/components/skiptrace-results'

function money(value: number) {
  return value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value) : '—'
}

function Stat({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 p-3"><Icon className="h-4 w-4 text-primary" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div></div>
}

export default function LeadDetailPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = use(params)
  const validKind = kind === 'seller' || kind === 'buyer' ? kind : null
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [skipTraceState, setSkipTraceState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [skipTraceResult, setSkipTraceResult] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!validKind) { setLoading(false); setError('This lead type is not valid.'); return }
    void fetchLeads(validKind as LeadKind, id).then(async (result) => {
      if (!result || Array.isArray(result)) setError(`No ${validKind} lead found for ID ${id}.`)
      else {
        setLead(result)
        const cached = await fetch(`/api/leads/trigger?property_lead_id=${encodeURIComponent(result.id)}&source_id=${encodeURIComponent(result.sourceId)}`, { cache: 'no-store' }).then((response) => response.json()).catch(() => null)
        if (cached?.result) setSkipTraceResult(cached.result)
      }
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load this lead from Supabase.')).finally(() => setLoading(false))
  }, [id, validKind])

  async function startSkipTrace() {
    if (!lead) return
    setSkipTraceState('loading')
    try {
      const ownerName = String(lead.ownerName ?? '').trim().toUpperCase()
      const cityStateZip = [lead.city, lead.state, lead.zip].filter(Boolean).join(', ')
      const propertyAddress = [lead.address, cityStateZip].filter(Boolean).join(', ')
      const response = await fetch('https://bertie-irresistible-rostrally.ngrok-free.dev/webhook-test/skip-trace', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ownership_type: lead.ownershipType, workflow: 'skiptrace', property_lead_id: lead.id, name_query: `${ownerName};${cityStateZip}`, address_query: propertyAddress }) })
      if (!response.ok) throw new Error(`Workflow request failed:${response.statusText}`)
      const payload = await response.json().catch(() => null)
      const unwrapResult = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.length > 0 ? unwrapResult(value[0]) : null 
        if (!value || typeof value !== 'object') return value
        const record = value as Record<string, unknown>
        const nested = record.result ?? record.data ?? record.body ?? record.json
        if (nested && nested !== value) return unwrapResult(nested)
        const numericKey = Object.keys(record).find((key) => /^\d+$/.test(key))
        return numericKey ? unwrapResult(record[numericKey]) : value
      }
      const result = unwrapResult(payload)
      if (result !==null && result !==undefined) setSkipTraceResult(result as Record<string, unknown>)
      setSkipTraceState('sent')
    } catch { setSkipTraceState('error') }
  }

  console.log("skiptracedata:",skipTraceResult)

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading lead…</main>
  if (!lead) return <main className="min-h-screen bg-background p-6 text-foreground"><div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8"><h1 className="text-2xl font-semibold">Lead unavailable</h1><p className="mt-2 text-muted-foreground">{error || 'This lead could not be found.'}</p><Link href="/?view=seller-leads" className="mt-6 inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="h-4 w-4" /> Back to leads</Link></div></main>

  const skipTraceSummary = (() => {
    if (!skipTraceResult) return 'No contact data returned'
    const record = skipTraceResult as Record<string, unknown>
    const values = (pattern: RegExp) => Object.keys(record).filter((key) => pattern.test(key)).flatMap((key) => (Array.isArray(record[key]) ? (record[key] as unknown[]) : [record[key]])).map((value) => (typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '')).filter(Boolean)
    const names = values(/^full_name$/i)
    const phones = values(/^(phone\d+|Phone-\d+)$/i)
    const emails = values(/^(email\d+|Email-\d+)$/i)
    const parts = [names.length ? `${names.length} match${names.length === 1 ? '' : 'es'}` : '', phones.length ? `${phones.length} phone${phones.length === 1 ? '' : 's'}` : '', emails.length ? `${emails.length} email${emails.length === 1 ? '' : 's'}` : ''].filter(Boolean)
    return parts.length ? parts.join(' · ') : 'No contact data returned'
  })()
  const fullAddress = [lead.address, lead.city, lead.state, lead.zip].filter(Boolean).join(', ')
  const hasCoordinates = Number.isFinite(lead.latitude) && Number.isFinite(lead.longitude) && (lead.latitude !== 0 || lead.longitude !== 0)
  const propertyStats = [{ icon: BedDouble, label: 'Bedrooms', value: lead.bedrooms || '—' }, { icon: Bath, label: 'Bathrooms', value: lead.bathrooms || '—' }, { icon: Ruler, label: 'Living area', value: lead.livingAreaSf ? `${lead.livingAreaSf.toLocaleString()} sf` : '—' }, { icon: Home, label: 'Property type', value: lead.propertyType || '—' }, { icon: Building2, label: 'Units', value: lead.units || '—' }, { icon: Sparkles, label: 'Year built', value: lead.yearBuilt || '—' }]
  return <main className="min-h-screen bg-background p-4 text-foreground md:p-8"><div className="mx-auto max-w-7xl space-y-6"><Link href={`/?view=${lead.kind}-leads`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to {lead.kind} leads</Link>{skipTraceResult && <SkipTraceResults result={skipTraceResult} />}<header className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-6 md:flex-row md:items-center"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{lead.kind} property</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">{lead.ownerName}</h1><p className="mt-2 flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />{fullAddress}</p></div><div className="rounded-xl bg-primary/10 px-5 py-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Ownership signal</p><p className="mt-1 text-lg font-semibold capitalize text-primary">{lead.ownershipType} owned</p></div></header><div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-semibold">Property location</h2><p className="text-sm text-muted-foreground">Exact coordinates from the property record</p></div><MapPin className="h-5 w-5 text-primary" /></div><div className="h-80 bg-muted">{hasCoordinates ? <PropertyLocationMap latitude={lead.latitude} longitude={lead.longitude} address={fullAddress} /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Location coordinates unavailable</div>}</div></section><section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center gap-3 border-b border-border p-5"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Home className="h-5 w-5 text-muted-foreground" /></div><div><h2 className="font-semibold">Property details</h2><p className="text-sm text-muted-foreground">Physical characteristics</p></div></div><div className="grid gap-3 p-5 sm:grid-cols-2">{propertyStats.map((stat) => <Stat key={stat.label} {...stat} value={String(stat.value)} />)}</div></section></div><div className="grid gap-6 lg:grid-cols-3"><section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2"><div className="flex items-center gap-3"><DollarSign className="h-5 w-5 text-primary" /><div><h2 className="font-semibold">Estimates</h2><p className="text-sm text-muted-foreground">Property and equity indicators</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat icon={DollarSign} label="Estimated value" value={money(lead.estimatedValue)} /><Stat icon={DollarSign} label="Estimated equity" value={money(Number(lead.raw.estimated_equity ?? 0))} /><Stat icon={DollarSign} label="Equity percentage" value={lead.equity ? `${lead.equity}%` : '—'} /><Stat icon={DollarSign} label="Last sale price" value={money(lead.lastSoldPrice)} /></div></section><section className="rounded-2xl border border-primary/30 bg-primary/5 p-5"><UserRound className="h-5 w-5 text-primary" /><h2 className="mt-3 font-semibold">Contacts & information</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Start a skip-tracing workflow using this property address to find contact information.</p><button type="button" onClick={startSkipTrace} disabled={skipTraceState === 'loading'} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">{skipTraceState === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{skipTraceState === 'sent' ? skipTraceSummary : 'Find contact information'}</button>{skipTraceState === 'error' && <p className="mt-2 text-xs text-destructive">Unable to start the skip-tracing workflow.</p>}</section></div></div></main>
}
