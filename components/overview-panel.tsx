'use client'

import { useEffect, useState } from 'react'
import {
  Building2, Users, FileText, MessageSquare,
  TrendingUp, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, ArrowRight, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type ActiveView } from '@/components/dashboard-shell'
import { cn } from '@/lib/utils'

interface OverviewStats {
  sellerLeads: number
  sellerVerified: number
  buyerLeads: number
  activeAgreements: number
  totalAgreements: number
  queuedMessages: number
  totalMessages: number
  recentPropertyLeads: Array<{
    id: string
    address: string
    owner: string
    city: string
    marketValue: number
    skipTraceStatus: string
  }>
  recentAgreements: Array<{
    id: string
    status: string
    buyerName: string
    sellerName: string
    purchasePrice: number
    versions: number
  }>
  recentCommunications: Array<{
    id: string
    recipientName: string
    channel: string
    subject?: string
    status: string
    createdAt: string
  }>
}

interface Props {
  user: {
    name: string
    role: string
  }
  onNavigate: (view: ActiveView) => void
}

export function OverviewPanel({ user, onNavigate }: Props) {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    fetch('/api/overview')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch overview')
        return res.json()
      })
      .then((data) => {
        if (!active) return
        setStats(data.stats)
      })
      .catch((err) => {
        if (!active) return
        setError(err.message || 'Failed to load overview')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const isAdmin = user.role === 'admin' || user.role === 'broker'

  const statCards = stats
    ? [
        {
          label: 'Seller Leads',
          value: stats.sellerLeads,
          sub: `${stats.sellerVerified} skip-traced`,
          icon: Building2,
          color: 'text-primary',
          bg: 'bg-primary/10 border-primary/20',
          view: 'seller-leads' as ActiveView,
        },
        {
          label: 'Buyer Leads',
          value: stats.buyerLeads,
          sub: 'Units > 2',
          icon: Users,
          color: 'text-[oklch(0.70_0.18_155)]',
          bg: 'bg-[oklch(0.70_0.18_155_/_10%)] border-[oklch(0.70_0.18_155_/_20%)]',
          view: 'buyer-leads' as ActiveView,
        },
        {
          label: 'Active Agreements',
          value: stats.activeAgreements,
          sub: `${stats.totalAgreements} total PSAs`,
          icon: FileText,
          color: 'text-[oklch(0.78_0.16_80)]',
          bg: 'bg-[oklch(0.78_0.16_80_/_10%)] border-[oklch(0.78_0.16_80_/_20%)]',
          view: 'agreements' as ActiveView,
        },
        {
          label: 'Queued Messages',
          value: stats.queuedMessages,
          sub: `${stats.totalMessages} total sent`,
          icon: MessageSquare,
          color: 'text-[oklch(0.60_0.20_300)]',
          bg: 'bg-[oklch(0.60_0.20_300_/_10%)] border-[oklch(0.60_0.20_300_/_20%)]',
          view: 'communications' as ActiveView,
        },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-semibold text-foreground text-balance">
          Welcome back, {user.name.split(' ')[0]}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s a summary of your leads pipeline and active workflows.
        </p>
      </div>

      {/* Dev notice */}
      <div className="px-4 py-2 bg-accent/10 border-b border-accent/20 rounded-xl">
        <p className="text-xs text-accent font-medium">Overview is still under development. Some features may not work as expected.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-muted" />
                <div className="w-4 h-4 rounded bg-muted" />
              </div>
              <div className="h-8 w-16 bg-muted rounded mb-2" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          ))
        ) : error ? (
          <div className="col-span-full flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        ) : (
          statCards.map((stat) => {
            const Icon = stat.icon
            const accessible = isAdmin || stat.view === 'agreements'
            return (
              <button
                key={stat.label}
                disabled={!accessible}
                onClick={() => accessible && onNavigate(stat.view)}
                className={cn(
                  'bg-card border border-border rounded-xl p-4 text-left transition-all group',
                  accessible
                    ? 'hover:border-primary/30 hover:bg-card/80 cursor-pointer'
                    : 'opacity-60 cursor-default'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('w-9 h-9 rounded-lg border flex items-center justify-center', stat.bg)}>
                    <Icon className={cn('w-4 h-4', stat.color)} />
                  </div>
                  {accessible && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{stat.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stat.sub}</p>
              </button>
            )
          })
        )}
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent property leads */}
        {isAdmin && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Recent Property Leads</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => onNavigate('seller-leads')}
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-muted" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-muted rounded mb-2" />
                      <div className="h-3 w-48 bg-muted rounded" />
                    </div>
                  </div>
                ))
              ) : stats?.recentPropertyLeads.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">No property leads found.</div>
              ) : (
                stats?.recentPropertyLeads.map((lead) => {
                  const skipColor =
                    lead.skipTraceStatus === 'verified'
                      ? 'text-[oklch(0.70_0.18_155)]'
                      : lead.skipTraceStatus === 'pending'
                      ? 'text-[oklch(0.78_0.16_80)]'
                      : 'text-destructive'
                  const SkipIcon =
                    lead.skipTraceStatus === 'verified'
                      ? CheckCircle2
                      : lead.skipTraceStatus === 'pending'
                      ? Clock
                      : AlertTriangle

                  return (
                    <div key={lead.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{lead.address}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.owner} · {lead.city}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-foreground">${lead.marketValue.toLocaleString()}</p>
                        <div className={cn('flex items-center gap-1 text-[10px] font-medium justify-end', skipColor)}>
                          <SkipIcon className="w-2.5 h-2.5" />
                          {lead.skipTraceStatus}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* PSA status */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[oklch(0.78_0.16_80)]" />
              <h3 className="text-sm font-semibold text-foreground">Agreement Status</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => onNavigate('agreements')}
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-muted rounded mb-2" />
                    <div className="h-3 w-32 bg-muted rounded" />
                  </div>
                </div>
              ))
            ) : stats?.recentAgreements.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">No agreements found.</div>
            ) : (
              stats?.recentAgreements.map((doc) => {
                const statusColors: Record<string, string> = {
                  draft: 'text-muted-foreground',
                  sent: 'text-primary',
                  countered: 'text-[oklch(0.78_0.16_80)]',
                  executed: 'text-[oklch(0.70_0.18_155)]',
                  expired: 'text-destructive',
                }
                return (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-[oklch(0.78_0.16_80_/_10%)] border border-[oklch(0.78_0.16_80_/_20%)] flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-[oklch(0.78_0.16_80)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">{doc.id}</span>
                        <span className={cn('text-[10px] font-semibold capitalize', statusColors[doc.status])}>
                          {doc.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{doc.buyerName} / {doc.sellerName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">${doc.purchasePrice.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{doc.versions} version{doc.versions !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent comms */}
      {isAdmin && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[oklch(0.60_0.20_300)]" />
              <h3 className="text-sm font-semibold text-foreground">Recent Communications</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => onNavigate('communications')}
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-muted rounded mb-2" />
                    <div className="h-3 w-48 bg-muted rounded" />
                  </div>
                </div>
              ))
            ) : stats?.recentCommunications.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">No communications found.</div>
            ) : (
              stats?.recentCommunications.map((msg) => {
                const channelLabel = { email: 'Email', sms: 'SMS', omnichannel: 'Omnichannel' }[msg.channel]
                const statusColor =
                  msg.status === 'delivered'
                    ? 'text-[oklch(0.70_0.18_155)]'
                    : msg.status === 'queued'
                    ? 'text-[oklch(0.78_0.16_80)]'
                    : msg.status === 'failed'
                    ? 'text-destructive'
                    : 'text-primary'
                return (
                  <div key={msg.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-[oklch(0.60_0.20_300_/_10%)] border border-[oklch(0.60_0.20_300_/_20%)] flex items-center justify-center shrink-0">
                      <MessageSquare className="w-3.5 h-3.5 text-[oklch(0.60_0.20_300)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{msg.recipientName}</p>
                      <p className="text-xs text-muted-foreground truncate">{channelLabel}{msg.subject ? ` · ${msg.subject}` : ''}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn('text-xs font-semibold capitalize', statusColor)}>{msg.status}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Viewer role notice */}
      {user.role === 'viewer' && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-secondary/40 border border-border">
          <AlertTriangle className="w-4 h-4 text-[oklch(0.78_0.16_80)] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Limited access</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You are signed in as a Viewer. You have read-only access to agreements and document previews.
              Contact your broker or admin for elevated permissions.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
