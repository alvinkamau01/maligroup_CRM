'use client'

import {
  Building2, Users, FileText, MessageSquare,
  TrendingUp, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  MOCK_PROPERTY_LEADS,
  MOCK_FACEBOOK_LEADS,
  MOCK_PSA_DOCUMENTS,
  MOCK_COMM_LOG,
  formatCurrency,
  formatDateTime,
  type AuthUser,
} from '@/lib/data'
import { type ActiveView } from '@/components/dashboard-shell'
import { cn } from '@/lib/utils'

interface Props {
  user: AuthUser
  onNavigate: (view: ActiveView) => void
}

export function OverviewPanel({ user, onNavigate }: Props) {
  const verifiedLeads = MOCK_PROPERTY_LEADS.filter((l) => l.skipTraceStatus === 'verified').length
  const activeAgreements = MOCK_PSA_DOCUMENTS.filter((d) => d.status !== 'expired').length
  const pendingMessages = MOCK_COMM_LOG.filter((m) => m.status === 'queued').length
  const highValueLeads = MOCK_PROPERTY_LEADS.filter((l) => l.marketValue >= 300000).length

  const stats = [
    {
      label: 'Seller Leads',
      value: MOCK_PROPERTY_LEADS.length,
      sub: `${verifiedLeads} skip-traced`,
      icon: Building2,
      color: 'text-primary',
      bg: 'bg-primary/10 border-primary/20',
      view: 'seller-leads' as ActiveView,
    },
    {
      label: 'Buyer Leads',
      value: MOCK_FACEBOOK_LEADS.length,
      sub: 'From FB groups',
      icon: Users,
      color: 'text-[oklch(0.70_0.18_155)]',
      bg: 'bg-[oklch(0.70_0.18_155_/_10%)] border-[oklch(0.70_0.18_155_/_20%)]',
      view: 'buyer-leads' as ActiveView,
    },
    {
      label: 'Active Agreements',
      value: activeAgreements,
      sub: `${MOCK_PSA_DOCUMENTS.length} total PSAs`,
      icon: FileText,
      color: 'text-[oklch(0.78_0.16_80)]',
      bg: 'bg-[oklch(0.78_0.16_80_/_10%)] border-[oklch(0.78_0.16_80_/_20%)]',
      view: 'agreements' as ActiveView,
    },
    {
      label: 'Queued Messages',
      value: pendingMessages,
      sub: `${MOCK_COMM_LOG.length} total sent`,
      icon: MessageSquare,
      color: 'text-[oklch(0.60_0.20_300)]',
      bg: 'bg-[oklch(0.60_0.20_300_/_10%)] border-[oklch(0.60_0.20_300_/_20%)]',
      view: 'communications' as ActiveView,
    },
  ]

  const isAdmin = user.role === 'admin' || user.role === 'broker'

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

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => {
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
        })}
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
              {MOCK_PROPERTY_LEADS.slice(0, 4).map((lead) => {
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
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(lead.marketValue)}</p>
                      <div className={cn('flex items-center gap-1 text-[10px] font-medium justify-end', skipColor)}>
                        <SkipIcon className="w-2.5 h-2.5" />
                        {lead.skipTraceStatus}
                      </div>
                    </div>
                  </div>
                )
              })}
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
            {MOCK_PSA_DOCUMENTS.map((doc) => {
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
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(doc.purchasePrice)}</p>
                    <p className="text-[10px] text-muted-foreground">{doc.versions.length} version{doc.versions.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )
            })}
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
            {MOCK_COMM_LOG.map((msg) => {
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
                    <p className="text-[10px] text-muted-foreground">{formatDateTime(msg.createdAt)}</p>
                  </div>
                </div>
              )
            })}
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
