'use client'

import { useState } from 'react'
import { ExternalLink, MessageCircle, Phone, Mail, Tag, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MOCK_FACEBOOK_LEADS, formatDateTime, type FacebookLead } from '@/lib/data'
import { cn } from '@/lib/utils'

const INTENT_CONFIG = {
  buyer: { label: 'Buyer', className: 'bg-primary/15 text-primary border-primary/30' },
  seller: { label: 'Seller', className: 'bg-[oklch(0.70_0.18_155_/_15%)] text-[oklch(0.70_0.18_155)] border-[oklch(0.70_0.18_155_/_30%)]' },
  iso: { label: 'ISO', className: 'bg-[oklch(0.78_0.16_80_/_15%)] text-[oklch(0.78_0.16_80)] border-[oklch(0.78_0.16_80_/_30%)]' },
  wtb: { label: 'WTB', className: 'bg-[oklch(0.60_0.20_300_/_15%)] text-[oklch(0.60_0.20_300)] border-[oklch(0.60_0.20_300_/_30%)]' },
}

export function FacebookLeadsPanel() {
  const [search, setSearch] = useState('')
  const [intentFilter, setIntentFilter] = useState<string>('all')

  const filtered = MOCK_FACEBOOK_LEADS.filter((lead) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      lead.authorName.toLowerCase().includes(q) ||
      lead.postText.toLowerCase().includes(q) ||
      lead.keywords.some((k) => k.toLowerCase().includes(q))
    const matchIntent = intentFilter === 'all' || lead.intent === intentFilter
    return matchSearch && matchIntent
  })

  return (
    <div className="space-y-4">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Facebook Group Leads</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Social intent signals — {filtered.length} posts matched</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Re-scrape
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name, post content, keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-secondary/50"
          />
        </div>
        <Select value={intentFilter} onValueChange={(v) => v && setIntentFilter(v)}>
          <SelectTrigger className="h-8 w-36 text-xs bg-secondary/50">
            <SelectValue placeholder="Intent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Intents</SelectItem>
            <SelectItem value="buyer">Buyer</SelectItem>
            <SelectItem value="seller">Seller</SelectItem>
            <SelectItem value="iso">ISO</SelectItem>
            <SelectItem value="wtb">WTB</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lead cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No leads match your filters.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <FacebookLeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  )
}

function FbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3H13v6.8c4.56-.93 8-4.96 8-9.8z" />
    </svg>
  )
}

function FacebookLeadCard({ lead }: { lead: FacebookLead }) {
  const intentCfg = INTENT_CONFIG[lead.intent]

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 hover:border-border/80 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">{lead.authorName.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{lead.authorName}</span>
              <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border', intentCfg.className)}>
                {intentCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <FbIcon className="w-3 h-3 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{lead.groupName}</span>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <span className="text-xs text-muted-foreground">{formatDateTime(lead.postedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="font-mono text-[10px] text-muted-foreground">{lead.id}</span>
          <a href={lead.postUrl} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Post text */}
      <div className="bg-secondary/30 rounded-lg px-3 py-2.5">
        <p className="text-sm text-foreground leading-relaxed">{lead.postText}</p>
      </div>

      {/* Comment if present */}
      {lead.includesComment && lead.commentText && (
        <div className="flex items-start gap-2 pl-4 border-l-2 border-primary/30">
          <MessageCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground italic leading-relaxed">{lead.commentText}</p>
        </div>
      )}

      {/* Keywords */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
        {lead.keywords.map((kw) => (
          <span key={kw} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border">
            {kw}
          </span>
        ))}
      </div>

      {/* Contact info + actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-border/50">
        <div className="flex items-center gap-3 flex-wrap">
          {lead.phone && (
            <div className="flex items-center gap-1 text-xs text-foreground">
              <Phone className="w-3 h-3 text-muted-foreground" />
              {lead.phone}
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1 text-xs text-foreground">
              <Mail className="w-3 h-3 text-muted-foreground" />
              {lead.email}
            </div>
          )}
          {!lead.phone && !lead.email && (
            <span className="text-xs text-muted-foreground/60 italic">No contact info extracted</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
            <Phone className="w-3 h-3" />
            Contact
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1.5">
            <FbIcon className="w-3 h-3" />
            Save Lead
          </Button>
        </div>
      </div>
    </div>
  )
}
