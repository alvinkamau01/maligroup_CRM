'use client'

import { useEffect, useState, useRef } from 'react'
import { Building2, MapPin, Phone, Mail, CheckCircle2, Clock, XCircle, Eye, ChevronDown, ChevronUp, Search as SearchIcon, Loader2, MessageCircle, Trash2, Edit3, UserRound, Sparkles, Send, CalendarRange } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { fetchLeads, fetchAllLeads, type LeadKind, type Lead, submitLead, updateStatus, fetchLeadNotes, createLeadNote, editLeadNote, removeLeadNote, type LeadNote } from '@/lib/leads'
import { cn } from '@/lib/utils'
import { type PipelineRow } from '@/lib/buybox'
import { SkipTraceResults } from '@/components/skiptrace-results'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'

type Status =
  | 'Call'
  | 'Waiting on Seller'
  | 'Call Back'
  | 'Waiting on Buyer'
  | 'In Escrow'
  | 'Closed'
  | 'Dead'

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
  dateAdded: string
  equity: string
  beds: string
  baths: string
  sqft: string
  skipTraced: boolean
  notesCount: number
  lastNoteAt: string | null
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

  // Map backend status to our Status type, default to 'Call'
  const backendStatus = lead.status || 'Call'
  const mappedStatus: Status = STATUSES.includes(backendStatus as Status) ? backendStatus as Status : 'Call'

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
    status: mappedStatus,
    notes: '',
    dateAdded,
    equity,
    beds: String(lead.bedrooms),
    baths: String(lead.bathrooms),
    sqft,
    skipTraced: false,
    notesCount: lead.notesCount ?? 0,
    lastNoteAt: lead.lastNoteAt ?? null,
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
  status: '',
  notesCount: 0,
  lastNoteAt: null
}

function calcEquity(arv: string, offer: string) {
  const a = parseFloat(arv.replace(/[^0-9.]/g, ''))
  const o = parseFloat(offer.replace(/[^0-9.]/g, ''))
  if (!isNaN(a) && !isNaN(o)) return '$' + (a - o).toLocaleString()
  return '—'
}

function relativeTime(from: string): string {
  const fromDate = new Date(from)
  const now = new Date()
  const diffMs = now.getTime() - fromDate.getTime()
  const diffMins = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMs / 3600000)
  const diffDays = Math.round(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(fromDate)
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
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesError, setNotesError] = useState('')
  const [noteError, setNoteError] = useState('')
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editingNoteVal, setEditingNoteVal] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [submittingNote, setSubmittingNote] = useState(false)
  const [skipTracing, setSkipTracing] = useState<number | null>(null)
  const [skipTraceResults, setSkipTraceResults] = useState<Record<number, { result: any; contacts: { phones: any[]; emails: string[] }; state: 'idle' | 'loading' | 'done' | 'error'; error?: string }>>({})
  const [showContacts, setShowContacts] = useState<{ dealId: number; open: boolean } | null>(null)
  const [submitting,setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [fetchedStatus, setFetchedStatus] = useState<string>(row.status)

  const notesRef = useRef<HTMLDivElement>(null)

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
  
  console.log('deals:',deals)

  async function loadNotes(dealId: number) {
    setNotesLoading(true)
    setNotesError('')
    try {
      const notes = await fetchLeadNotes(dealId)
      setNotes(notes)
    } catch (error) {
      setNotesError(error instanceof Error ? error.message : 'Failed to load notes')
      console.error('[v0] Load notes failed:', error)
    } finally {
      setNotesLoading(false)
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
    if (selectedDeal?.id === id) {
      setSelectedDeal({ ...selectedDeal, status })
    }
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

  async function handleAddNote(dealId: number, body: string) {
    setSubmittingNote(true)
    setNoteError('')
    try {
      if (!newNoteVal.trim()) {
        setNoteError('Comment cannot be empty')
        return
      }
      if (newNoteVal.trim().length > 4000) {
        setNoteError('Comment exceeds 4000 characters')
        return
      }
      const newNote = await createLeadNote(dealId, body.trim())
      setNotes([...notes, newNote])
      setNewNoteVal('')
      setAddingNote(false)
      setSubmittingNote(false)
      
      // Update deal notes count and refresh the deal list to update notesCount
      setDeals(deals.map(d => d.id === dealId ? { ...d, notesCount: d.notesCount + 1 } : d))
      setSelectedDeal(selectedDeal ? { ...selectedDeal, notesCount: selectedDeal.notesCount + 1 } : null)
    } catch (error) {
      setSubmittingNote(false)
      setNoteError(error instanceof Error ? error.message : 'Failed to save note')
    }
  }

async function handleSelectStatus(id: number, status: string) {
    try {
      await updateStatus(String(id), status)
      setSuccessMessage('Status successfully updated.')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch {
      setMessage('Failed to set status')
    }
  }

  async function runSkipTrace(deal: Deal) {
    const id = deal.id
    setSkipTracing(id)
    setSkipTraceResults(prev => ({
      ...prev,
      [id]: { ...prev[id], state: 'loading', error: undefined }
    }))
    try {
      const ownerName = deal.owner.trim().toUpperCase()
      const addressParts = deal.property.split(',').map(s => s.trim())
      const city = addressParts[1] || ''
      const stateZip = addressParts[2] || ''
      const state = stateZip.split(' ')[0] || ''
      const zip = stateZip.split(' ')[1] || ''
      const cityStateZip = [city, state, zip].filter(Boolean).join(', ')

      const response = await fetch('/api/leads/skiptrace-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: ownerName,
          address: deal.address || deal.property,
          city,
          state,
          zip
        }),
      })

      const payload = await response.json()
      console.log('payload:', payload)

      if (!response.ok) {
        throw new Error('Skip trace workflow could not be reached.')
      }

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

      const contacts = payload ? extractContacts(payload) : { phones: [], emails: [] }

      setSkipTraceResults(prev => ({
        ...prev,
        [id]: { result: payload, contacts, state: 'done' }
      }))

      // Update deal with first phone/email found
      const firstPhone = contacts.phones[0]?.value
      const firstEmail = contacts.emails[0]
      if (firstPhone || firstEmail) {
        const updated = deals.map((d) =>
          d.id === id ? { ...d, ownerPhone: firstPhone || '', ownerEmail: firstEmail || '', skipTraced: true } : d
        )
        setDeals(updated)
        const updatedDeal = updated.find((d) => d.id === id)!
        if (selectedDeal?.id === id) setSelectedDeal(updatedDeal)
      }

      setShowContacts({ dealId: id, open: true })
      setSuccessMessage(`Skip trace complete: found ${contacts.phones.length} phone${contacts.phones.length !== 1 ? 's' : ''} and ${contacts.emails.length} email${contacts.emails.length !== 1 ? 's' : ''}`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Skip trace failed'
      setSkipTraceResults(prev => ({
        ...prev,
        [id]: { ...prev[id], state: 'error', error: message }
      }))
      setMessage(message)
    } finally {
      setSkipTracing(null)
    }
  }

  function handleSkipTrace(dealId: number) {
    const deal = deals.find(d => d.id === dealId)
    if (deal) runSkipTrace(deal)
  }

  function openDeal(deal: Deal) {
    setSelectedDeal(deal)
    setNoteVal(deal.notes)
    setEditingNote(false)
    setAddingNote(false)
    setNewNoteVal('')
    setNotes([])
    setNotesError('')
    setNoteError('')
    setEditingNoteId(null)
    setConfirmDelete(null)
    void loadNotes(deal.id)
  }

  async function handleEditNote(noteId: number) {
    setSubmittingNote(true)
    setNoteError('')
    try {
      if (!editingNoteVal.trim()) {
        setNoteError('Comment cannot be empty')
        setSubmittingNote(false)
        return
      }
      if (editingNoteVal.trim().length > 4000) {
        setNoteError('Comment exceeds 4000 characters')
        setSubmittingNote(false)
        return
      }
      await editLeadNote(noteId, editingNoteVal.trim())
      setNotes(notes.map((n) => n.id === noteId ? { ...n, body: editingNoteVal.trim(), updated_at: new Date().toISOString() } : n))
      setEditingNoteId(null)
      setEditingNoteVal('')
      setSubmittingNote(false)
    } catch (error) {
      setSubmittingNote(false)
      setNoteError(error instanceof Error ? error.message : 'Failed to update note')
    }
  }

  async function handleConfirmDeleteNote(noteId: number) {
    setSubmittingNote(true)
    setNoteError('')
    try {
      await removeLeadNote(noteId)
      setNotes(notes.filter((n) => n.id !== noteId))
      setConfirmDelete(null)
      // Update notes count in deal list
      setDeals(deals.map(d => d.id === selectedDeal?.id ? { ...d, notesCount: Math.max(0, d.notesCount - 1) } : d))
      setSelectedDeal(selectedDeal ? { ...selectedDeal, notesCount: Math.max(0, selectedDeal.notesCount - 1) } : null)
      setSubmittingNote(false)
    } catch (error) {
      setSubmittingNote(false)
      setNoteError(error instanceof Error ? error.message : 'Failed to delete note')
    }
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

      {/* Main layout: table */}
      <div className="flex flex-1 overflow-hidden">
        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--background)' }}>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Property Lead', 'Asking', 'ARV', 'Offer', 'Owner', 'Repairs', 'Status', 'Notes'].map((col) => (
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
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin text-accent" />
                      <span className="text-sm">Loading {label.toLowerCase()} leads…</span>
                    </div>
                  </td>
                </tr>
              ) : searched.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-sm text-muted-foreground">
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
                          onChange={(e) => {
                            const status = e.target.value as Status
                            handleStatusChange(deal.id, status)
                            handleSelectStatus(deal.id, status)
                          }}
                          className={cn('text-xs font-medium px-2.5 py-1 rounded-full appearance-none cursor-pointer outline-none border', STATUS_STYLES[deal.status].pill)}
                          style={{ background: 'none' }}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status} style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {deal.notesCount > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">{deal.notesCount}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

      {/* Property lead detail dialog */}
      <Dialog open={selectedDeal !== null} onOpenChange={(open) => { if (!open) setSelectedDeal(null) }}>
        <DialogContent
          className="sm:max-w-2xl max-h-[100vh] overflow-y-auto flex flex-col p-6"
        >
          {selectedDeal && (
            <>
            {/* Panel header */}
            <div className="flex flex-col px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="text-sm font-semibold text-foreground" style={{ letterSpacing: '-0.01em' }}>
                {selectedDeal.property}
              </div>
              <div className="text-xs mt-0.5 text-muted-foreground">{selectedDeal.address}</div>
              <span className={cn('inline-block mt-2 text-xs font-medium px-2.5 py-0.5 rounded-full border', STATUS_STYLES[selectedDeal.status].badge)}>
                {selectedDeal.status}
              </span>
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
                </div>
              )}

              {/* Skip Trace Section */}
              <div className="mt-4 space-y-4">
                {(() => {
                  const skipTrace = skipTraceResults[selectedDeal.id]
                  return (
                    <div>
                      {skipTrace?.state === 'idle' && (
                        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                          No skip trace has been run for this lead yet.
                        </div>
                      )}
                      <Button
                        onClick={() => handleSkipTrace(selectedDeal.id)}
                        disabled={skipTracing === selectedDeal.id || skipTrace?.state === 'loading'}
                        className="w-full"
                      >
                        {skipTracing === selectedDeal.id || skipTrace?.state === 'loading' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" data-icon="inline-start" />
                            Running Skip Trace…
                          </>
                        ) : (
                          <>
                            <UserRound data-icon="inline-start" />
                            {skipTrace?.state === 'done' ? 'Re-run skip trace' : 'Run skip trace'}
                          </>
                        )}
                      </Button>
                      {skipTrace?.state === 'error' && (
                        <p className="text-sm text-destructive">{skipTrace.error ?? 'Skip trace workflow could not be reached.'}</p>
                      )}
                      {skipTrace?.result && <SkipTraceResults result={skipTrace.result} />}

                      {skipTrace?.contacts && (skipTrace.contacts.phones.length > 0 || skipTrace.contacts.emails.length > 0) ? (
                        <Button variant="outline" className="w-full" onClick={() => setShowContacts({ dealId: selectedDeal.id, open: true })}>
                          <Phone data-icon="inline-start" />
                          Show Contacts ({skipTrace.contacts.phones.length + skipTrace.contacts.emails.length})
                        </Button>
                      ) : skipTrace?.state === 'done' ? (
                        <p className="text-xs text-muted-foreground text-center py-2">No contacts found for this lead.</p>
                      ) : null}
                    </div>
                  )
                })()}
              </div>

              <Sheet open={showContacts?.dealId === selectedDeal.id && showContacts.open} onOpenChange={(open) => setShowContacts(open ? null : (showContacts ? { dealId: showContacts.dealId, open: false } : null))}>
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Contact Information</SheetTitle>
                    <SheetDescription>
                      {selectedDeal.owner} · {selectedDeal.property}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 space-y-6 px-4 pb-6">
                    {showContacts?.dealId === selectedDeal.id && skipTraceResults[selectedDeal.id]?.contacts?.phones.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">Phone Numbers</p>
                        <div className="space-y-2">
                          {skipTraceResults[selectedDeal.id]!.contacts.phones.map((phone: any, index: number) => (
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

                    {showContacts?.dealId === selectedDeal.id && skipTraceResults[selectedDeal.id]?.contacts?.emails.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">Email Addresses</p>
                        <div className="space-y-2">
                          {skipTraceResults[selectedDeal.id]!.contacts.emails.map((email: string, index: number) => (
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

                    {showContacts?.dealId === selectedDeal.id && (!skipTraceResults[selectedDeal.id]?.contacts || (skipTraceResults[selectedDeal.id]?.contacts?.phones.length === 0 && skipTraceResults[selectedDeal.id]?.contacts?.emails.length === 0)) && (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">No contact information available.</p>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

{/* Notes */}
            <div className="px-6 py-4 flex-1 flex flex-col overflow-hidden min-h-[300px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Comments
                  {selectedDeal.notesCount > 0 && (
                    <span className="bg-accent text-accent-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                      {selectedDeal.notesCount}
                    </span>
                  )}
                </div>
                {!addingNote && (
                  <button
                    onClick={() => { setAddingNote(true); setNewNoteVal(''); setNoteError('') }}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md transition-all border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="text-sm leading-none">+</span> Add Comment
                  </button>
                )}
              </div>

              {/* New comment input */}
              {addingNote && (
                <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
                  <form
                  onSubmit= {(e)=>{
                  e.preventDefault()
                  if (selectedDeal){handleAddNote(selectedDeal!.id, newNoteVal)}}
                  }>
                  <textarea
                    autoFocus
                    value={newNoteVal}
                    onChange={(e) => { setNewNoteVal(e.target.value); setNoteError('') }}
                    rows={3}
                    placeholder="Type your comment…"
                    maxLength={4000}
                    className="w-full text-sm px-3 py-2 rounded-md outline-none resize-none border border-border bg-background text-foreground placeholder:text-muted-foreground"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{newNoteVal.length}/4000</span>
                    <div className="flex gap-2">
                      <Button
                        type= "submit"
                        disabled={!newNoteVal.trim() || submittingNote}
                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-accent text-accent-foreground hover:bg-accent/85 transition-colors disabled:opacity-50"
                      >
                        {submittingNote ? 'Saving…' : 'Save'}
                      </Button>
                  
                      <Button
                        onClick={() => { setAddingNote(false); setNewNoteVal(''); setNoteError('') }}
                        className="text-xs px-3 py-1.5 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                  </form>
                </div>
              )}

              {/* Error message */}
              {noteError && (
                <div className="mb-2 text-xs text-coral bg-coral/10 border border-coral/40 rounded-md px-3 py-1.5">
                  {noteError}
                </div>
              )}

              {/* Loading skeleton */}
              {notesLoading ? (
                <div className="flex flex-col gap-3">
                  {[1,2,3].map((i) => (
                    <div key={i} className="rounded-md px-3 py-2.5 border border-border bg-background">
                      <div className="h-3 w-20 bg-muted animate-pulse rounded mb-2" />
                      <div className="h-3 w-full bg-muted animate-pulse rounded mb-1" />
                      <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : notesError ? (
                <div className="text-sm text-coral">{notesError}</div>
              ) : (
                <div className="flex-1 overflow-y-auto min-h-[200px]" ref={notesRef}>
                  {notes.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p className="text-sm">No comments yet. Add one above.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 pb-4">
                      {notes.map((note) => {
                        const isOwner = user && user.id === note.created_by
                        return (
                          <div
                            key={note.id}
                            className="rounded-lg px-4 py-3 border border-border bg-card shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium text-foreground">
                                {note.author_email ?? note.created_by ?? 'Unknown'}
                                {isOwner && (
                                  <span className="ml-1.5 text-xs bg-accent/15 text-accent px-1.5 py-0.5 rounded-full">You</span>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">{relativeTime(note.created_at)}</span>
                            </div>
                            {editingNoteId === note.id ? (
                              <div className="mt-2">
                                <textarea
                                  autoFocus
                                  value={editingNoteVal}
                                  onChange={(e) => setEditingNoteVal(e.target.value)}
                                  rows={3}
                                  maxLength={4000}
                                  className="w-full text-sm px-3 py-2 rounded-md outline-none resize-none border border-border bg-background text-foreground"
                                />
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-muted-foreground">{editingNoteVal.length}/4000</span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditNote(note.id)}
                                      disabled={!editingNoteVal.trim() || submittingNote}
                                      className="text-xs font-medium px-3 py-1.5 rounded-md bg-accent text-accent-foreground hover:bg-accent/85 transition-colors disabled:opacity-50"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => { setEditingNoteId(null); setEditingNoteVal(''); setEditingNote(false) }}
                                      className="text-xs px-3 py-1.5 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed mb-1.5 text-foreground whitespace-pre-wrap">{note.body}</p>
                            )}
                            {isOwner && editingNoteId !== note.id && (
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => handleEditNote(note.id,)}
                                  className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                                >
                                  <Edit3 className="h-3 w-3" /> Edit
                                </button>
                                {confirmDelete === note.id ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleConfirmDeleteNote(note.id)}
                                      disabled={submittingNote}
                                      className="text-xs font-medium px-2 py-1 rounded-md bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors disabled:opacity-50"
                                    >
                                      {submittingNote ? '…' : 'Confirm'}
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete(null)}
                                      className="text-xs px-2 py-1 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDelete(note.id)}
                                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-red-500/15 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" /> Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="text-xs text-muted-foreground">Added {selectedDeal.dateAdded}</div>
            </div>
            </>
          )}
          </DialogContent>
        </Dialog>
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
          className="fixed inset-0 z-50 flex items-start justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div
            className="w-full max-w-lg rounded-xl p-6 border border-border bg-card"
            style={{
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              maxHeight: 'calc(100vh - 2rem)',
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
