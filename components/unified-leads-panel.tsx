'use client'

import { useEffect, useState } from 'react'
import { Building2, MapPin, Phone, Mail, CheckCircle2, Clock, XCircle, Eye, ChevronDown, ChevronUp, Search as SearchIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchLeads, fetchAllLeads, type LeadKind, type Lead, submitLead } from '@/lib/leads'
import { cn } from '@/lib/utils'
import { type PipelineRow } from '@/lib/buybox'

type Status =
  | 'Call'
  | 'Waiting on Seller'
  | 'Call Back'
  | 'Waiting on Buyer'
  | 'In Escrow'
  | 'Closed'
  | 'Dead'

interface NoteEntry {
  id: number
  text: string
  timestamp: string
}

interface Deal {
  id: number
  property: string
  address: string
  asking: string
  arv: string
  offer: string
  owner: string
  ownerPhone: string
  ownerEmail: string
  repairs: string
  status: Status
  notes: string
  noteEntries: NoteEntry[]
  dateAdded: string
  equity: string
  beds: string
  baths: string
  sqft: string
  skipTraced: boolean
}

const STATUSES: Status[] = [
  'Call',
  'Waiting on Seller',
  'Call Back',
  'Waiting on Buyer',
  'In Escrow',
  'Closed',
  'Dead',
]

const STATUS_STYLES: Record<Status, { pill: string; badge: string }> = {
  Call: {
    pill: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
  },
  'Waiting on Seller': {
    pill: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  },
  'Call Back': {
    pill: 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
    badge: 'bg-violet-500/20 text-violet-300 border border-violet-500/40',
  },
  'Waiting on Buyer': {
    pill: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
  },
  'In Escrow': {
    pill: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
  },
  Closed: {
    pill: 'bg-green-500/15 text-green-400 border border-green-500/30',
    badge: 'bg-green-500/20 text-green-300 border border-green-500/40',
  },
  Dead: {
    pill: 'bg-red-500/15 text-red-400 border border-red-500/30',
    badge: 'bg-red-500/20 text-red-300 border border-red-500/40',
  },
}

function mapLeadToDeal(lead: Lead): Deal {
  const arv = lead.estimatedValue > 0 ? `$${lead.estimatedValue.toLocaleString()}` : '—'
  const asking = lead.lastSoldPrice > 0 ? `$${lead.lastSoldPrice.toLocaleString()}` : '—'
  const equity = lead.equity > 0 ? `$${lead.equity.toLocaleString()}` : '—'
  const sqft = lead.livingAreaSf > 0 ? lead.livingAreaSf.toLocaleString() : '—'
  const addressLine = [lead.address, lead.city, lead.state, lead.zip].filter(Boolean).join(', ')
  const dateAdded = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })


  return {
    id: Number(lead.id) || Date.now(),
    property: addressLine,
    address: addressLine,
    asking,
    arv,
    offer: '—',
    owner: lead.ownerName,
    ownerPhone: '',
    ownerEmail: '',
    repairs: '—',
    status: 'Call',
    notes: '',
    noteEntries: [],
    dateAdded,
    equity,
    beds: String(lead.bedrooms),
    baths: String(lead.bathrooms),
    sqft,
    skipTraced: false,
  }
}

const BLANK_PIPELINE_ROW: PipelineRow = {
  propertyLeadId: 0,
  sourceId: null,
  address: '',
  city: '',
  state: '',
  zip: '',
  propertyType: '',
  bedrooms: 0,
  bathrooms: 0,
  livingAreaSf: 0,
  yearBuilt: 0,
  estimatedValue: 0,
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
  latitude: 0,
  longitude: 0,
  createdAt: new Date().toISOString(),
  skiptraceId: null,
  skiptracedAt: null,
  conversationCount: 0,
  lastConversationAt: null,
  contractCount: 0,
  anySent: false,
  anyReplied: false,
  stage: 'new_match',
}

let globalNoteId = 100

function calcEquity(arv: string, offer: string) {
  const a = parseFloat(arv.replace(/[^0-9.]/g, ''))
  const o = parseFloat(offer.replace(/[^0-9.]/g, ''))
  if (!isNaN(a) && !isNaN(o)) return '$' + (a - o).toLocaleString()
  return '—'
}

export function UnifiedLeadsPanel({ kind, user }: { kind: LeadKind; user: any }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [row, setRow] = useState<PipelineRow>(BLANK_PIPELINE_ROW)

  const [deals, setDeals] = useState<Deal[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<Status | 'All'>('All')
  const [showModal, setShowModal] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [editingNote, setEditingNote] = useState(false)
  const [noteVal, setNoteVal] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [newNoteVal, setNewNoteVal] = useState('')
  const [skipTracing, setSkipTracing] = useState<number | null>(null)
  const [submitting,setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const filtered =
    activeFilter === 'All'
      ? deals
      : deals.filter((d) => d.status === activeFilter)

  const searched =
    searchQuery.trim() === ''
      ? filtered
      : filtered.filter((deal) => {
          const q = searchQuery.toLowerCase()
          return (
            deal.property.toLowerCase().includes(q) ||
            deal.address.toLowerCase().includes(q) ||
            deal.owner.toLowerCase().includes(q)
          )
        })

  async function load() {
    setLoading(true)
    setMessage('')
    try {
      const allLeads = await fetchAllLeads()
      const sellerLeads = allLeads.filter((lead:any) => lead.units <= 2)
      const buyerLeads = allLeads.filter((lead:any) => lead.units > 2)
      const mapped = kind === 'buyer' ? buyerLeads.map(mapLeadToDeal) : sellerLeads.map(mapLeadToDeal)
      setDeals(mapped)
      setNextId(mapped.length > 0 ? Math.max(...mapped.map((d:any) => d.id)) + 1 : 1)
      if (!mapped.length) setMessage(`No ${kind} leads found (${kind === 'buyer' ? 'units > 2' : 'units ≤ 2'}).`)
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown Supabase error'
      console.error('[v0] Lead query failed:', { kind, details })
      setDeals([])
      setMessage(`Unable to load ${kind} leads from Supabase: ${details}`)
    } finally {
      setLoading(false)
    }
  }

  const label = kind === 'buyer' ? 'Buyer' : 'Seller'

  useEffect(() => { void load() }, [kind])

  async function trigger() {
    setMessage('')
    const response = await fetch('/api/leads/trigger', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        leadType: kind,
        userId: user.id,
        userEmail: user.email,
        triggeredAt: new Date().toISOString(),
      }),
    })
    setMessage(response.ok ? 'Workflow triggered. Refreshing leads…' : 'Workflow could not be triggered.')
    if (response.ok) setTimeout(() => void load(), 1500)
  }

  function handleStatusChange(id: number, status: Status) {
    setDeals(deals.map((d) => (d.id === id ? { ...d, status } : d)))
    if (selectedDeal?.id === id) setSelectedDeal({ ...selectedDeal, status })
  }

  function handleSaveNote(id: number) {
    setDeals(deals.map((d) => (d.id === id ? { ...d, notes: noteVal } : d)))
    if (selectedDeal?.id === id) setSelectedDeal({ ...selectedDeal, notes: noteVal })
    setEditingNote(false)
  }

  async function handleSubmit() {
    if (!row.address.trim()) return
    setSubmitting(true)
    try {
      await submitLead(row)
      setShowModal(false)
      setRow(BLANK_PIPELINE_ROW)
      setSuccessMessage('Property successfully added.')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch {
      // error handling could be added here
    } finally {
      setSubmitting(false)
    }
  }

  function handleAddNote(id: number) {
    if (!newNoteVal.trim()) return
    const now = new Date()
    const ts = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const entry: NoteEntry = { id: globalNoteId++, text: newNoteVal.trim(), timestamp: ts }
    const updated = deals.map((d) =>
      d.id === id ? { ...d, noteEntries: [entry, ...d.noteEntries] } : d
    )
    setDeals(updated)
    const updatedDeal = updated.find((d) => d.id === id)!
    if (selectedDeal?.id === id) setSelectedDeal(updatedDeal)
    setNewNoteVal('')
    setAddingNote(false)
  }

  function handleSkipTrace(id: number) {
    setSkipTracing(id)
    setTimeout(() => {
      const fakePhone = `(${Math.floor(Math.random() * 900) + 100}) 555-0${Math.floor(Math.random() * 900) + 100}`
      const deal = deals.find((d) => d.id === id)
      const fakeEmail = deal
        ? deal.owner.toLowerCase().replace(' ', '.') + '@skipmail.net'
        : 'owner@skipmail.net'
      const updated = deals.map((d) =>
        d.id === id ? { ...d, ownerPhone: fakePhone, ownerEmail: fakeEmail, skipTraced: true } : d
      )
      setDeals(updated)
      const updatedDeal = updated.find((d) => d.id === id)!
      if (selectedDeal?.id === id) setSelectedDeal(updatedDeal)
      setSkipTracing(null)
    }, 1800)
  }

  function openDeal(deal: Deal) {
    setSelectedDeal(deal)
    setNoteVal(deal.notes)
    setEditingNote(false)
    setAddingNote(false)
    setNewNoteVal('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{label} leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Every deal you&apos;re working</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
          <span className="text-base leading-none">+</span>
          Add Deal Manually
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-6 py-3 flex-wrap shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search address, owner, or property…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
        {(['All', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveFilter(s)}
            className={cn(
              'text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-150 border-2',
              activeFilter === s
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-transparent text-muted-foreground border-border hover:border-accent/50 hover:text-foreground'
            )}
          >
            {s}
          </button>
        ))}
        </div>
      </div>

      {/* Main layout: table + detail panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--background)' }}>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Property Lead', 'Asking', 'ARV', 'Offer', 'Owner', 'Repairs', 'Status'].map((col) => (
                  <th
                    key={col}
                    className="text-left px-6 py-3 text-xs font-medium uppercase tracking-widest text-muted-foreground"
                    style={{ letterSpacing: '0.08em' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin text-accent" />
                      <span className="text-sm">Loading {label.toLowerCase()} leads…</span>
                    </div>
                  </td>
                </tr>
              ) : searched.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm text-muted-foreground">
                    {searchQuery ? 'No deals match your search.' : 'No deals with this status.'}
                  </td>
                </tr>
              ) : (
                searched.map((deal, i) => {
                  const isSelected = selectedDeal?.id === deal.id
                  return (
                    <tr
                      key={deal.id}
                      onClick={() => openDeal(deal)}
                      className="cursor-pointer transition-colors duration-100"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: isSelected ? 'var(--secondary)' : i % 2 === 0 ? 'transparent' : 'var(--muted)',
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">{deal.property || 'Unknown property'}</div>
                        <div className="text-xs mt-0.5 text-muted-foreground">{deal.address}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-muted-foreground">{deal.asking}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-emerald-500">{deal.arv}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-sky-500">{deal.offer}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-foreground">{deal.owner}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-orange-500">{deal.repairs}</span>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={deal.status}
                          onChange={(e) => handleStatusChange(deal.id, e.target.value as Status)}
                          className={cn('text-xs font-medium px-2.5 py-1 rounded-full appearance-none cursor-pointer outline-none border', STATUS_STYLES[deal.status].pill)}
                          style={{ background: 'none' }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selectedDeal && (
          <div
            className="shrink-0 overflow-y-auto flex flex-col border-l"
            style={{
              width: '360px',
              borderLeftColor: 'var(--border)',
              backgroundColor: 'var(--muted)',
            }}
          >
            {/* Panel header */}
            <div className="flex items-start justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex-1 pr-3">
                <div className="text-sm font-semibold text-foreground" style={{ letterSpacing: '-0.01em' }}>
                  {selectedDeal.property}
                </div>
                <div className="text-xs mt-0.5 text-muted-foreground">{selectedDeal.address}</div>
                <span className={cn('inline-block mt-2 text-xs font-medium px-2.5 py-0.5 rounded-full border', STATUS_STYLES[selectedDeal.status].badge)}>
                  {selectedDeal.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedDeal(null)}
                className="text-xs rounded px-1.5 py-1 transition-colors text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Financials */}
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="text-xs font-medium uppercase tracking-widest mb-3 text-muted-foreground">Financials</div>
              <div className="grid grid-cols-2 gap-y-3">
                {[
                  ['Asking', selectedDeal.asking, 'text-muted-foreground'],
                  ['ARV', selectedDeal.arv, 'text-emerald-500'],
                  ['Offer', selectedDeal.offer, 'text-sky-500'],
                  ['Repairs', selectedDeal.repairs, 'text-orange-500'],
                  ['Equity', selectedDeal.equity, 'text-violet-500'],
                ].map(([label, val, color]) => (
                  <div key={label}>
                    <div className="text-xs mb-0.5 text-muted-foreground">{label}</div>
                    <div className={cn('text-sm font-medium font-mono', color)}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Property details */}
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="text-xs font-medium uppercase tracking-widest mb-3 text-muted-foreground">Property</div>
              <div className="flex gap-6">
                {[
                  ['Beds', selectedDeal.beds],
                  ['Baths', selectedDeal.baths],
                  ['Sq Ft', selectedDeal.sqft],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-xs mb-0.5 text-muted-foreground">{label}</div>
                    <div className="text-sm font-medium text-foreground">{val || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Owner info */}
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="text-xs font-medium uppercase tracking-widest mb-3 text-muted-foreground">Owner</div>
              <div className="text-sm font-medium mb-2 text-foreground">{selectedDeal.owner || '—'}</div>

              {selectedDeal.ownerPhone || selectedDeal.ownerEmail ? (
                <>
                  {selectedDeal.ownerPhone && (
                    <div className="text-xs mb-0.5 text-muted-foreground">{selectedDeal.ownerPhone}</div>
                  )}
                  {selectedDeal.ownerEmail && (
                    <div className="text-xs mb-3 text-muted-foreground">{selectedDeal.ownerEmail}</div>
                  )}
                  <div className="flex gap-2">
                    <a
                      href={`tel:${selectedDeal.ownerPhone}`}
                      className="text-xs font-medium px-3 py-1.5 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Call
                    </a>
                    <a
                      href={`mailto:${selectedDeal.ownerEmail}`}
                      className="text-xs font-medium px-3 py-1.5 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Email
                    </a>
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-xs mb-3 text-muted-foreground">No contact info available for this owner.</p>
                  <button
                    onClick={() => handleSkipTrace(selectedDeal.id)}
                    disabled={skipTracing === selectedDeal.id}
                    className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-md transition-all duration-150 border border-coral/40 bg-coral/10 text-coral hover:bg-coral/20 disabled:opacity-50"
                  >
                    {skipTracing === selectedDeal.id ? (
                      <>
                        <span
                          className="inline-block w-2.5 h-2.5 border-2 border-coral border-t-transparent rounded-full animate-spin"
                        />
                        Running Skip Trace…
                      </>
                    ) : (
                      <>
                        <span className="text-sm leading-none">⚡</span>
                        Skip Trace Owner
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="px-6 py-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Notes</div>
                {!addingNote && (
                  <button
                    onClick={() => { setAddingNote(true); setNewNoteVal('') }}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md transition-all border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="text-sm leading-none">+</span> Add Note
                  </button>
                )}
              </div>

              {/* New note input */}
              {addingNote && (
                <div className="mb-4">
                  <textarea
                    autoFocus
                    value={newNoteVal}
                    onChange={(e) => setNewNoteVal(e.target.value)}
                    rows={3}
                    placeholder="Type your note here…"
                    className="w-full text-sm px-3 py-2 rounded-md outline-none resize-none border border-border bg-background text-foreground"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleAddNote(selectedDeal.id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-md bg-accent text-accent-foreground hover:bg-accent/85 transition-colors"
                    >
                      Save Note
                    </button>
                    <button
                      onClick={() => { setAddingNote(false); setNewNoteVal('') }}
                      className="text-xs px-3 py-1.5 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Note entries */}
              {selectedDeal.noteEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet. Add one above.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedDeal.noteEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-md px-3 py-2.5 border border-border bg-background"
                    >
                      <p className="text-sm leading-relaxed mb-1.5 text-foreground">{entry.text}</p>
                      <div className="text-xs text-muted-foreground font-mono">{entry.timestamp}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="text-xs text-muted-foreground">Added {selectedDeal.dateAdded}</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer count */}
      <div className="px-6 py-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-xs text-muted-foreground">
          {searched.length} deal{searched.length !== 1 ? 's' : ''} · {activeFilter !== 'All' ? activeFilter : 'All Statuses'}
        </span>
      </div>

      {/* Add Deal Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div
            className="w-full max-w-lg rounded-xl p-6 border border-border bg-card"
            style={{
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground" style={{ letterSpacing: '-0.01em' }}>
                Add Deal Manually
              </h2>
              <button onClick={() => setShowModal(false)} className="text-sm px-2 py-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['Property Address', 'address', 'col-span-2'],
                  ['City', 'city', ''],
                  ['State', 'state', ''],
                  ['ZIP', 'zip', ''],
                  ['Property Type', 'propertyType', 'col-span-2'],
                  ['Owner Name', 'ownerName', 'col-span-2'],
                  ['Bedrooms', 'bedrooms', ''],
                  ['Bathrooms', 'bathrooms', ''],
                  ['Living Area Sq Ft', 'livingAreaSf', 'col-span-2'],
                  ['Estimated Value', 'estimatedValue', ''],
                  ['Estimated Equity', 'estimatedEquity', ''],
                  ['Equity Percentage', 'estimatedEquityPercentage', ''],
                ] as [string, keyof Pick<PipelineRow,
                  'address' | 'city' | 'state' | 'zip' | 'propertyType' | 'ownerName' |
                  'bedrooms' | 'bathrooms' | 'livingAreaSf' | 'estimatedValue' |
                  'estimatedEquity' | 'estimatedEquityPercentage'>, string][]
              ).map(([label, key, span]) => (
                <div key={key} className={span || ''}>
                  <label className="block text-xs mb-1.5 text-muted-foreground">{label}</label>
                  <input
                    type={typeof row[key] === 'number' ? 'number' : 'text'}
                    required
                    value={String(row[key])}
                    onChange={(e) => setRow({
                      ...row,
                      [key]: typeof row[key] === 'number' ? Number(e.target.value) : e.target.value,
                    })}
                    className="w-full text-sm px-3 py-2 rounded-md outline-none border border-border bg-background text-foreground"
                    placeholder={label}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="text-sm px-4 py-2 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="text-sm font-medium px-4 py-2 rounded-md bg-accent text-accent-foreground hover:bg-accent/85 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      {successMessage && (
        <div
          role="status"
          className="fixed right-6 top-6 z-[60] rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-300 shadow-lg"
        >
          {successMessage}
        </div>
      )}
    </div>
  )
}
