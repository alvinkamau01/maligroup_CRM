'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowUpRight, Building2, RefreshCw, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchLeads, type LeadKind } from '@/lib/leads'
import { type AuthUser } from '@/lib/data'

export function UnifiedLeadsPanel({ kind, user }: { kind: LeadKind; user: AuthUser }) {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  async function load() {
    setLoading(true)
    setMessage('')
    try {
      const nextLeads = await fetchLeads(kind)
      setLeads(nextLeads)
      if (!nextLeads.length) setMessage(`Supabase returned no ${kind} leads from property_leads (${kind === 'buyer' ? 'units > 2' : 'units ≤ 2'}).`)
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown Supabase error'
      console.error('[v0] Lead query failed:', { kind, details })
      setLeads([])
      setMessage(`Unable to load ${kind} leads from Supabase: ${details}`)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, [kind])
  async function trigger() { setMessage(''); const response = await fetch('/api/leads/trigger', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ leadType: kind, userId: user.id, userEmail: user.email, triggeredAt: new Date().toISOString() }) }); setMessage(response.ok ? 'Workflow triggered. Refreshing leads…' : 'Workflow could not be triggered.'); if (response.ok) setTimeout(() => void load(), 1500) }
  const label = kind === 'buyer' ? 'Buyer' : 'Seller'
  return <section className="space-y-5"><header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Lead intelligence</p><h1 className="mt-1 text-3xl font-semibold">{label} leads</h1><p className="mt-2 text-sm text-muted-foreground">Live property_leads data · {kind === 'buyer' ? 'any ownership type with more than 2 units.' : 'any ownership type with 1–2 units.'}</p></div><div className="flex gap-2"><Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button><Button onClick={trigger}>Run {label.toLowerCase()} workflow</Button></div></header>{message && <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{message}</p>}{loading ? <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">Loading {label.toLowerCase()} leads…</div> : <div className="space-y-3">{leads.map((lead) => <Link key={lead.id} href={`/leads/${kind}/${lead.id}`} className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-accent"><div className="flex min-w-0 items-center gap-4"><div className="rounded-lg bg-primary/10 p-2 text-primary">{kind === 'buyer' ? <Building2 className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}</div><div className="min-w-0"><h2 className="truncate font-medium">{lead.ownerName}</h2><p className="truncate text-sm text-muted-foreground">{lead.address}{lead.city ? ` · ${lead.city}` : ''}</p></div></div><div className="flex shrink-0 items-center gap-5 text-right">{kind === 'buyer' && <div><p className="text-xl font-semibold text-primary">{lead.units}</p><p className="text-xs text-muted-foreground">units</p></div>}<ArrowUpRight className="h-5 w-5 text-muted-foreground" /></div></Link>)}{!leads.length && <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No {label.toLowerCase()} leads found.</div>}</div>}</section>
}
