'use client'

import { useState } from 'react'
import {
  FileText, Plus, Eye, GitCompare, Send, Clock, CheckCircle2,
  XCircle, AlertTriangle, ChevronRight, ArrowLeftRight, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MOCK_PSA_DOCUMENTS,
  computePSADiff,
  formatCurrency,
  formatDate,
  formatDateTime,
  type PSADocument,
  type PSAVersion,
  type DiffChange,
} from '@/lib/data'
import { cn } from '@/lib/utils'

const PSA_STATUS_CONFIG = {
  draft: { icon: Clock, label: 'Draft', className: 'bg-muted text-muted-foreground border-border' },
  sent: { icon: Send, label: 'Sent', className: 'bg-primary/15 text-primary border-primary/30' },
  countered: { icon: AlertTriangle, label: 'Countered', className: 'bg-[oklch(0.78_0.16_80_/_15%)] text-[oklch(0.78_0.16_80)] border-[oklch(0.78_0.16_80_/_30%)]' },
  executed: { icon: CheckCircle2, label: 'Executed', className: 'bg-[oklch(0.70_0.18_155_/_15%)] text-[oklch(0.70_0.18_155)] border-[oklch(0.70_0.18_155_/_30%)]' },
  expired: { icon: XCircle, label: 'Expired', className: 'bg-destructive/15 text-destructive border-destructive/30' },
}

type ActiveMode = 'list' | 'view' | 'diff'

export function PSAManagerPanel() {
  const [mode, setMode] = useState<ActiveMode>('list')
  const [selectedDoc, setSelectedDoc] = useState<PSADocument | null>(null)
  const [selectedVersionA, setSelectedVersionA] = useState<string>('')
  const [selectedVersionB, setSelectedVersionB] = useState<string>('')

  function openDoc(doc: PSADocument) {
    setSelectedDoc(doc)
    setMode('view')
  }

  function openDiff(doc: PSADocument) {
    setSelectedDoc(doc)
    const versions = doc.versions
    if (versions.length >= 2) {
      setSelectedVersionA(versions[versions.length - 2].version)
      setSelectedVersionB(versions[versions.length - 1].version)
    }
    setMode('diff')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mode !== 'list' && (
            <button
              onClick={() => setMode('list')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              PSA Manager
            </button>
          )}
          {mode !== 'list' && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          <h3 className="text-base font-semibold text-foreground">
            {mode === 'list' ? 'PSA Manager' : mode === 'view' ? `${selectedDoc?.id}` : `Diff — ${selectedDoc?.id}`}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'list' && (
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              New Agreement
            </Button>
          )}
          {mode === 'view' && selectedDoc && selectedDoc.versions.length >= 2 && (
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openDiff(selectedDoc)}>
              <GitCompare className="w-3.5 h-3.5" />
              Compare Versions
            </Button>
          )}
        </div>
      </div>

      {/* List view */}
      {mode === 'list' && <PSAList docs={MOCK_PSA_DOCUMENTS} onView={openDoc} onDiff={openDiff} />}

      {/* Document view */}
      {mode === 'view' && selectedDoc && (
        <PSADocumentView doc={selectedDoc} />
      )}

      {/* Diff view */}
      {mode === 'diff' && selectedDoc && (
        <PSADiffView
          doc={selectedDoc}
          versionA={selectedVersionA}
          versionB={selectedVersionB}
          onChangeA={setSelectedVersionA}
          onChangeB={setSelectedVersionB}
        />
      )}
    </div>
  )
}

// ─── PSA List ─────────────────────────────────────────────────────────────────

function PSAList({ docs, onView, onDiff }: { docs: PSADocument[]; onView: (d: PSADocument) => void; onDiff: (d: PSADocument) => void }) {
  return (
    <div className="space-y-3">
      {docs.map((doc) => {
        const statusCfg = PSA_STATUS_CONFIG[doc.status]
        const StatusIcon = statusCfg.icon
        const latestVersion = doc.versions[doc.versions.length - 1]
        return (
          <div key={doc.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-mono text-xs font-bold text-foreground">{doc.id}</span>
                    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border', statusCfg.className)}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {statusCfg.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-mono">
                      {latestVersion.version}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{doc.propertyAddress}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">Buyer: <span className="text-foreground">{doc.buyerName}</span></span>
                    <span className="text-xs text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground">Seller: <span className="text-foreground">{doc.sellerName}</span></span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">Price: <span className="text-foreground font-semibold">{formatCurrency(doc.purchasePrice)}</span></span>
                    <span className="text-xs text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground">Closing: <span className="text-foreground">{formatDate(doc.closingDate)}</span></span>
                    <span className="text-xs text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground">Earnest: <span className="text-foreground">{formatCurrency(doc.earnestDeposit)}</span></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onView(doc)}>
                  <Eye className="w-3.5 h-3.5" />
                  View
                </Button>
                {doc.versions.length >= 2 && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onDiff(doc)}>
                    <GitCompare className="w-3.5 h-3.5" />
                    Diff
                  </Button>
                )}
                <Button size="sm" className="h-7 text-xs gap-1">
                  <Send className="w-3.5 h-3.5" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── PSA Document View ────────────────────────────────────────────────────────

function PSADocumentView({ doc }: { doc: PSADocument }) {
  const [activeVersion, setActiveVersion] = useState(doc.versions[doc.versions.length - 1].version)
  const version = doc.versions.find((v) => v.version === activeVersion) ?? doc.versions[doc.versions.length - 1]

  return (
    <div className="space-y-4">
      {/* Doc meta */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetaItem label="Property" value={doc.propertyAddress} />
          <MetaItem label="Purchase Price" value={formatCurrency(doc.purchasePrice)} highlight />
          <MetaItem label="Earnest Deposit" value={formatCurrency(doc.earnestDeposit)} />
          <MetaItem label="Closing Date" value={formatDate(doc.closingDate)} />
          <MetaItem label="Buyer" value={doc.buyerName} />
          <MetaItem label="Seller" value={doc.sellerName} />
          <MetaItem label="Created" value={formatDateTime(doc.createdAt)} />
          <MetaItem label="Last Updated" value={formatDateTime(version.createdAt)} />
        </div>
      </div>

      {/* Version selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground font-medium">Version:</span>
        <div className="flex items-center gap-1">
          {doc.versions.map((v) => (
            <button
              key={v.version}
              onClick={() => setActiveVersion(v.version)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors',
                activeVersion === v.version
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'bg-secondary/40 text-muted-foreground border-border hover:text-foreground'
              )}
            >
              {v.version}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          By {version.createdBy} — {formatDateTime(version.createdAt)}
        </span>
      </div>

      {/* Clauses */}
      <div className="space-y-2">
        {version.clauses.map((clause, idx) => (
          <div key={clause.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono text-muted-foreground/60">{String(idx + 1).padStart(2, '0')}</span>
              <h4 className="text-sm font-semibold text-foreground">{clause.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-6">{clause.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PSA Diff View ────────────────────────────────────────────────────────────

function PSADiffView({
  doc, versionA, versionB, onChangeA, onChangeB
}: {
  doc: PSADocument
  versionA: string
  versionB: string
  onChangeA: (v: string) => void
  onChangeB: (v: string) => void
}) {
  const vA = doc.versions.find((v) => v.version === versionA)
  const vB = doc.versions.find((v) => v.version === versionB)
  const changes: DiffChange[] = vA && vB ? computePSADiff(vA, vB) : []

  const added = changes.filter((c) => c.type === 'added')
  const removed = changes.filter((c) => c.type === 'removed')
  const modified = changes.filter((c) => c.type === 'modified')

  return (
    <div className="space-y-4">
      {/* Diff header card */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 font-mono text-xs">
            <span className="text-muted-foreground">Document:</span>
            <span className="font-bold text-foreground">{doc.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={versionA} onValueChange={(v) => v && onChangeA(v)}>
              <SelectTrigger className="h-7 w-24 text-xs font-mono bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {doc.versions.map((v) => (
                  <SelectItem key={v.version} value={v.version}>{v.version}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground" />
            <Select value={versionB} onValueChange={(v) => v && onChangeB(v)}>
              <SelectTrigger className="h-7 w-24 text-xs font-mono bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {doc.versions.map((v) => (
                  <SelectItem key={v.version} value={v.version}>{v.version}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary counters */}
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[oklch(0.70_0.18_155_/_15%)] text-[oklch(0.70_0.18_155)] border border-[oklch(0.70_0.18_155_/_30%)]">
              +{added.length} Added
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-destructive/15 text-destructive border border-destructive/30">
              -{removed.length} Removed
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[oklch(0.78_0.16_80_/_15%)] text-[oklch(0.78_0.16_80)] border border-[oklch(0.78_0.16_80_/_30%)]">
              ~{modified.length} Modified
            </span>
          </div>
        </div>
      </div>

      {/* No diff */}
      {changes.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-6 rounded-xl border border-border bg-card text-sm text-muted-foreground justify-center">
          <Info className="w-4 h-4" />
          No differences detected between {versionA} and {versionB}.
        </div>
      )}

      {/* Modified */}
      {modified.length > 0 && (
        <DiffSection title="Modified Clauses" type="modified" changes={modified} />
      )}

      {/* Added */}
      {added.length > 0 && (
        <DiffSection title="Added Clauses" type="added" changes={added} />
      )}

      {/* Removed */}
      {removed.length > 0 && (
        <DiffSection title="Removed Clauses" type="removed" changes={removed} />
      )}
    </div>
  )
}

function DiffSection({ title, type, changes }: { title: string; type: 'added' | 'removed' | 'modified'; changes: DiffChange[] }) {
  const typeConfig = {
    added: {
      bar: 'bg-[oklch(0.70_0.18_155)]',
      bg: 'bg-[oklch(0.70_0.18_155_/_8%)]',
      border: 'border-[oklch(0.70_0.18_155_/_20%)]',
      title: 'text-[oklch(0.70_0.18_155)]',
      oldBg: '',
      newBg: 'bg-[oklch(0.70_0.18_155_/_15%)]',
      oldText: '',
      newText: 'text-[oklch(0.70_0.18_155)]',
    },
    removed: {
      bar: 'bg-destructive',
      bg: 'bg-destructive/8',
      border: 'border-destructive/20',
      title: 'text-destructive',
      oldBg: 'bg-destructive/15',
      newBg: '',
      oldText: 'text-destructive',
      newText: '',
    },
    modified: {
      bar: 'bg-[oklch(0.78_0.16_80)]',
      bg: 'bg-[oklch(0.78_0.16_80_/_8%)]',
      border: 'border-[oklch(0.78_0.16_80_/_20%)]',
      title: 'text-[oklch(0.78_0.16_80)]',
      oldBg: 'bg-destructive/12',
      newBg: 'bg-[oklch(0.70_0.18_155_/_12%)]',
      oldText: 'text-destructive',
      newText: 'text-[oklch(0.70_0.18_155)]',
    },
  }[type]

  return (
    <div className={cn('rounded-xl border overflow-hidden', typeConfig.bg, typeConfig.border)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-inherit">
        <div className={cn('w-1 h-4 rounded-full', typeConfig.bar)} />
        <h4 className={cn('text-sm font-semibold', typeConfig.title)}>{title}</h4>
        <span className={cn('text-xs font-mono ml-auto', typeConfig.title)}>
          {changes.length} clause{changes.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="divide-y divide-border/40">
        {changes.map((change) => (
          <div key={change.field} className="px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">{change.field}</p>
            {change.oldValue && (
              <div className={cn('px-3 py-2 rounded-lg text-xs leading-relaxed line-through', typeConfig.oldBg, typeConfig.oldText)}>
                {change.oldValue}
              </div>
            )}
            {change.newValue && (
              <div className={cn('px-3 py-2 rounded-lg text-xs leading-relaxed', typeConfig.newBg, typeConfig.newText)}>
                {change.newValue}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function MetaItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
      <p className={cn('text-xs text-foreground leading-tight', highlight && 'text-sm font-bold text-primary')}>{value}</p>
    </div>
  )
}
