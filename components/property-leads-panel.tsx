'use client'

import { useState } from 'react'
import {
  Building2, MapPin, Phone, Mail, CheckCircle2, Clock, XCircle,
  Filter, Download, RefreshCw, ChevronDown, ChevronUp, Eye
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MOCK_PROPERTY_LEADS, formatCurrency, formatDate, type PropertyLead } from '@/lib/data'
import { cn } from '@/lib/utils'

const SKIP_TRACE_CONFIG = {
  verified: { icon: CheckCircle2, label: 'Verified', className: 'bg-[oklch(0.70_0.18_155_/_15%)] text-[oklch(0.70_0.18_155)] border-[oklch(0.70_0.18_155_/_30%)]' },
  pending: { icon: Clock, label: 'Pending', className: 'bg-[oklch(0.78_0.16_80_/_15%)] text-[oklch(0.78_0.16_80)] border-[oklch(0.78_0.16_80_/_30%)]' },
  failed: { icon: XCircle, label: 'Failed', className: 'bg-destructive/15 text-destructive border-destructive/30' },
}

const PROPERTY_STATUS_CONFIG = {
  'vacant': { label: 'Vacant', className: 'bg-primary/15 text-primary border-primary/30' },
  'owner-occupied': { label: 'Owner Occupied', className: 'bg-muted text-muted-foreground border-border' },
  'pre-foreclosure': { label: 'Pre-Foreclosure', className: 'bg-[oklch(0.78_0.16_80_/_15%)] text-[oklch(0.78_0.16_80)] border-[oklch(0.78_0.16_80_/_30%)]' },
  'bank-owned': { label: 'Bank Owned', className: 'bg-destructive/15 text-destructive border-destructive/30' },
}

export function PropertyLeadsPanel() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [skipFilter, setSkipFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = MOCK_PROPERTY_LEADS.filter((lead) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      lead.address.toLowerCase().includes(q) ||
      lead.owner.toLowerCase().includes(q) ||
      lead.county.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || lead.propertyStatus === statusFilter
    const matchSkip = skipFilter === 'all' || lead.skipTraceStatus === skipFilter
    return matchSearch && matchStatus && matchSkip
  })

  return (
    <div className="space-y-4">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Property Leads</h3>
          <p className="text-xs text-muted-foreground mt-0.5">County / tax database — {filtered.length} records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Sync
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search address, owner, county..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-secondary/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="h-8 w-40 text-xs bg-secondary/50">
            <SelectValue placeholder="Property Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="vacant">Vacant</SelectItem>
            <SelectItem value="owner-occupied">Owner Occupied</SelectItem>
            <SelectItem value="pre-foreclosure">Pre-Foreclosure</SelectItem>
            <SelectItem value="bank-owned">Bank Owned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={skipFilter} onValueChange={(v) => v && setSkipFilter(v)}>
          <SelectTrigger className="h-8 w-36 text-xs bg-secondary/50">
            <SelectValue placeholder="Skip Trace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Skip Trace</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table header */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 bg-secondary/40 border-b border-border px-4 py-2.5">
          {['Lead ID', 'Property / Owner', 'Market Value', 'Acreage', 'Skip Trace', 'Status'].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 first:pl-0 last:pr-0">
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No leads match your filters.</div>
          ) : (
            filtered.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                expanded={expandedId === lead.id}
                onToggle={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function LeadRow({ lead, expanded, onToggle }: { lead: PropertyLead; expanded: boolean; onToggle: () => void }) {
  const skipCfg = SKIP_TRACE_CONFIG[lead.skipTraceStatus]
  const SkipIcon = skipCfg.icon
  const propCfg = PROPERTY_STATUS_CONFIG[lead.propertyStatus]

  return (
    <>
      <div
        className={cn(
          'grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 px-4 py-3 items-center hover:bg-secondary/30 transition-colors cursor-pointer',
          expanded && 'bg-secondary/20'
        )}
        onClick={onToggle}
      >
        {/* Lead ID */}
        <div className="px-2 first:pl-0">
          <span className="font-mono text-[11px] text-muted-foreground">{lead.id}</span>
        </div>

        {/* Property / Owner */}
        <div className="px-2 min-w-0">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground leading-tight truncate">{lead.address}</p>
              <p className="text-xs text-muted-foreground truncate">{lead.owner}</p>
              <p className="text-[10px] text-muted-foreground/70 truncate">{lead.city}, {lead.county} County — {lead.zip}</p>
            </div>
          </div>
        </div>

        {/* Market Value */}
        <div className="px-2 text-right">
          <span className="text-sm font-semibold text-foreground">{formatCurrency(lead.marketValue)}</span>
        </div>

        {/* Acreage */}
        <div className="px-2 text-right">
          <span className="text-sm text-foreground">{lead.acreage} ac</span>
        </div>

        {/* Skip Trace */}
        <div className="px-2">
          <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border', skipCfg.className)}>
            <SkipIcon className="w-2.5 h-2.5" />
            {skipCfg.label}
          </span>
        </div>

        {/* Property Status */}
        <div className="px-2 last:pr-0 flex items-center gap-2">
          <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border', propCfg.className)}>
            {propCfg.label}
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded detail row */}
      {expanded && (
        <div className="px-4 py-4 bg-secondary/10 border-t border-border/50">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <DetailItem label="Legal Description" value={lead.legalDescription} mono />
            <DetailItem label="Contact Phone" value={lead.contactPhone ?? 'Not available'} icon={<Phone className="w-3 h-3" />} />
            <DetailItem label="Contact Email" value={lead.contactEmail ?? 'Not available'} icon={<Mail className="w-3 h-3" />} />
            <DetailItem label="Added" value={formatDate(lead.createdAt)} />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" className="h-7 text-xs gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              View Full Record
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Generate PSA
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Contact Owner
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

function DetailItem({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className={cn('text-xs text-foreground', mono && 'font-mono text-[11px]')}>{value}</p>
      </div>
    </div>
  )
}
