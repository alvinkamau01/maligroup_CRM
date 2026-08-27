'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Mail, MessageSquare, Layers, Send, CheckCircle2, Clock,
  XCircle, AlertCircle, Phone, User, AtSign, ChevronDown, ChevronUp,
  Info, Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MOCK_COMM_LOG, formatDateTime, type CommMessage, type UserRole } from '@/lib/data'
import { cn } from '@/lib/utils'
import type { SkipTraceAddressEntry } from '@/app/api/communications/skiptrace/route'

const CHANNEL_CONFIG = {
  email: { icon: Mail, label: 'Email', className: 'bg-primary/15 text-primary border-primary/30' },
  sms: { icon: MessageSquare, label: 'SMS', className: 'bg-[oklch(0.70_0.18_155_/_15%)] text-[oklch(0.70_0.18_155)] border-[oklch(0.70_0.18_155_/_30%)]' },
  omnichannel: { icon: Layers, label: 'Omnichannel', className: 'bg-[oklch(0.78_0.16_80_/_15%)] text-[oklch(0.78_0.16_80)] border-[oklch(0.78_0.16_80_/_30%)]' },
}

const STATUS_CONFIG = {
  queued: { icon: Clock, label: 'Queued', className: 'text-[oklch(0.78_0.16_80)]' },
  sent: { icon: Send, label: 'Sent', className: 'text-primary' },
  delivered: { icon: CheckCircle2, label: 'Delivered', className: 'text-[oklch(0.70_0.18_155)]' },
  failed: { icon: XCircle, label: 'Failed', className: 'text-destructive' },
}

interface Props {
  userRole: UserRole
}

type ComposeChannel = 'email' | 'sms' | 'omnichannel'

interface ComposeState {
  channel: ComposeChannel
  recipientName: string
  recipientEmail: string
  recipientPhone: string
  subject: string
  body: string
}

const INITIAL_COMPOSE: ComposeState = {
  channel: 'email',
  recipientName: '',
  recipientEmail: '',
  recipientPhone: '',
  subject: '',
  body: '',
}

function buildSuggestedMessage({
  firstName,
  streetAddress,
  cityStateZip,
  channel,
}: {
  firstName: string
  streetAddress: string
  cityStateZip: string
  channel: ComposeChannel
}): string {
  const propertyRef = streetAddress || 'your property'
  const locationLine = cityStateZip ? ` in ${cityStateZip}` : ''

  if (channel === 'sms') {
    return `Hi ${firstName}, this is a local buyer reaching out about your property at ${propertyRef}. Would you be open to a cash offer? Happy to work around your timeline. Reply here or call me back — thanks!`
  }

  return [
    `Hi ${firstName},`,
    '',
    `My name is [Your Name] and I'm a local real estate buyer. I came across your property at ${propertyRef}${locationLine} and wanted to reach out directly to see if you'd have any interest in selling.`,
    '',
    "I buy houses as-is, so there's no need for repairs, showings, or agent commissions. I can move at whatever pace works best for you and can typically close within a couple of weeks if that's helpful.",
    '',
    'If you have a few minutes, I would love to learn more about the property and answer any questions you might have. No pressure at all — just exploring whether it makes sense for both of us.',
    '',
    'Feel free to reply to this message or give me a call whenever is convenient.',
    '',
    'Best regards,',
    '[Your Name]',
    '[Your Phone Number]',
  ].join('\n')
}

export function CommunicationsPanel({ userRole }: Props) {
  const [log, setLog] = useState<CommMessage[]>(MOCK_COMM_LOG)
  const [compose, setCompose] = useState<ComposeState>(INITIAL_COMPOSE)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ComposeState, string>>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { data: skiptraceData, isLoading: skiptraceLoading } = useSWR<{ rows: SkipTraceAddressEntry[] }>(
    '/api/communications/skiptrace',
    (url: string) => fetch(url).then((response) => response.json())
  )

  const isReadOnly = userRole === 'viewer'

  function validate(): boolean {
    const e: typeof errors = {}
    if (!compose.recipientName.trim()) e.recipientName = 'Recipient name is required.'
    if ((compose.channel === 'email' || compose.channel === 'omnichannel') && !compose.recipientEmail.trim())
      e.recipientEmail = 'Recipient email is required for email / omnichannel.'
    if ((compose.channel === 'sms' || compose.channel === 'omnichannel') && !compose.recipientPhone.trim())
      e.recipientPhone = 'Recipient phone is required for SMS / omnichannel.'
    if ((compose.channel === 'email' || compose.channel === 'omnichannel') && !compose.subject.trim())
      e.subject = 'Subject line is required.'
    if (!compose.body.trim()) e.body = 'Message body is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSendClick() {
    if (!validate()) return
    setConfirmOpen(true)
  }

  function fillComposeFromSkipTrace(contact: SkipTraceAddressEntry) {
    const displayName = contact.fullName ?? (contact.livesIn ? `Contact near ${contact.livesIn}` : 'there')
    const firstName = contact.fullName ? contact.fullName.split(' ')[0] : 'there'
    const streetAddress = contact.streetAddress ?? ''
    const cityLine = contact.addressLocality ?? (contact.livesIn ? contact.livesIn.split(',')[0].trim() : null)
    const cityStateZip = [cityLine, contact.addressRegion, contact.postalCode].filter(Boolean).join(', ')
    const fullAddress = [streetAddress, cityStateZip].filter(Boolean).join(', ')

    setCompose((current) => ({
      ...current,
      channel: current.channel,
      recipientName: contact.fullName ?? displayName,
      recipientEmail: contact.emails[0] ?? '',
      recipientPhone: contact.phones[0]?.number ?? '',
      subject: fullAddress ? `Interested in your property at ${streetAddress || fullAddress}` : current.subject,
      body: buildSuggestedMessage({ firstName, streetAddress, cityStateZip, channel: current.channel }),
    }))
    setErrors({})
  }

  function handleConfirmSend() {
    const newMsg: CommMessage = {
      id: `MSG-${String(log.length + 1).padStart(3, '0')}`,
      channel: compose.channel,
      recipientName: compose.recipientName,
      recipientEmail: compose.recipientEmail || undefined,
      recipientPhone: compose.recipientPhone || undefined,
      subject: compose.subject || undefined,
      body: compose.body,
      status: 'queued',
      createdAt: new Date().toISOString(),
    }
    setLog([newMsg, ...log])
    setCompose(INITIAL_COMPOSE)
    setConfirmOpen(false)
    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  const smsCharCount = compose.body.length
  const smsWarn = compose.channel === 'sms' && smsCharCount > 160

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-foreground">Multi-Channel Communications</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Email, SMS, and omnichannel outreach with send log</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)_380px]">
        {/* ── Skip-traced contacts ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Skip-traced data</h4>
            <span className="text-xs font-mono text-muted-foreground">{skiptraceData?.rows?.length ?? 0}</span>
          </div>
          <div className="max-h-[560px] overflow-y-auto rounded-xl border border-border bg-card">
            {skiptraceLoading ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">Loading contacts...</p>
            ) : skiptraceData?.rows?.length ? (
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-muted/95">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 font-semibold text-muted-foreground">Address</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {skiptraceData.rows.map((contact) => (
                    <SkipTraceTableRow
                      key={contact.entryId}
                      contact={contact}
                      onSelect={() => fillComposeFromSkipTrace(contact)}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">No skip-traced contacts yet.</p>
            )}
          </div>
        </div>

        {/* ── Compose form ── */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Compose Message</h4>
              {isReadOnly && (
                <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  <Shield className="w-3 h-3" />
                  Read-only
                </span>
              )}
            </div>

            {/* Channel selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Channel
              </label>
              <div className="flex gap-2">
                {(['email', 'sms', 'omnichannel'] as ComposeChannel[]).map((ch) => {
                  const cfg = CHANNEL_CONFIG[ch]
                  const Icon = cfg.icon
                  return (
                    <button
                      key={ch}
                      disabled={isReadOnly}
                      onClick={() => setCompose((s) => ({ ...s, channel: ch }))}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors flex-1 justify-center',
                        compose.channel === ch
                          ? cfg.className
                          : 'bg-secondary/40 text-muted-foreground border-border hover:border-primary/30 hover:text-foreground',
                        isReadOnly && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Recipient Name */}
            <FormField
              label="Recipient Name"
              icon={<User className="w-3.5 h-3.5" />}
              error={errors.recipientName}
            >
              <Input
                disabled={isReadOnly}
                placeholder="e.g. Gerald Thibodaux"
                value={compose.recipientName}
                onChange={(e) => setCompose((s) => ({ ...s, recipientName: e.target.value }))}
                className="h-8 text-xs bg-secondary/50"
              />
            </FormField>

            {/* Email + Phone row */}
            <div className={cn(
              'grid gap-3',
              compose.channel === 'omnichannel' ? 'grid-cols-2' : 'grid-cols-1'
            )}>
              {(compose.channel === 'email' || compose.channel === 'omnichannel') && (
                <FormField
                  label="Recipient Email"
                  icon={<AtSign className="w-3.5 h-3.5" />}
                  error={errors.recipientEmail}
                >
                  <Input
                    disabled={isReadOnly}
                    type="email"
                    placeholder="contact@example.com"
                    value={compose.recipientEmail}
                    onChange={(e) => setCompose((s) => ({ ...s, recipientEmail: e.target.value }))}
                    className="h-8 text-xs bg-secondary/50"
                  />
                </FormField>
              )}
              {(compose.channel === 'sms' || compose.channel === 'omnichannel') && (
                <FormField
                  label="Recipient Phone"
                  icon={<Phone className="w-3.5 h-3.5" />}
                  error={errors.recipientPhone}
                >
                  <Input
                    disabled={isReadOnly}
                    type="tel"
                    placeholder="(225) 555-0000"
                    value={compose.recipientPhone}
                    onChange={(e) => setCompose((s) => ({ ...s, recipientPhone: e.target.value }))}
                    className="h-8 text-xs bg-secondary/50"
                  />
                </FormField>
              )}
            </div>

            {/* Subject (email / omnichannel only) */}
            {(compose.channel === 'email' || compose.channel === 'omnichannel') && (
              <FormField label="Subject" error={errors.subject}>
                <Input
                  disabled={isReadOnly}
                  placeholder="e.g. Purchase & Sale Agreement - 209 Old Mill Trace"
                  value={compose.subject}
                  onChange={(e) => setCompose((s) => ({ ...s, subject: e.target.value }))}
                  className="h-8 text-xs bg-secondary/50"
                />
              </FormField>
            )}

            {/* Message body */}
            <FormField label="Message Body" error={errors.body}>
              <div className="relative">
                <Textarea
                  disabled={isReadOnly}
                  placeholder={
                    compose.channel === 'sms'
                      ? 'Enter SMS text (160 char target)...'
                      : 'Enter your message here...'
                  }
                  value={compose.body}
                  onChange={(e) => setCompose((s) => ({ ...s, body: e.target.value }))}
                  className="text-xs bg-secondary/50 resize-none min-h-[100px]"
                  rows={4}
                />
                {compose.channel === 'sms' && (
                  <span className={cn(
                    'absolute bottom-2 right-2.5 text-[10px] font-mono',
                    smsWarn ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {smsCharCount}/160
                  </span>
                )}
              </div>
              {smsWarn && (
                <p className="text-[11px] text-[oklch(0.78_0.16_80)] flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  Message exceeds 160 characters — will be split into multiple segments.
                </p>
              )}
            </FormField>

            {/* Send button */}
            {!isReadOnly && (
              <Button
                className="w-full gap-2 text-sm"
                onClick={handleSendClick}
              >
                <Send className="w-4 h-4" />
                {compose.channel === 'omnichannel' ? 'Send Email + SMS' : compose.channel === 'sms' ? 'Send SMS' : 'Send Email'}
              </Button>
            )}

            {sent && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[oklch(0.70_0.18_155_/_12%)] border border-[oklch(0.70_0.18_155_/_25%)] text-[oklch(0.70_0.18_155)] text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Message queued successfully and added to the send log.
              </div>
            )}
          </div>

          {/* Confirm dialog (inline) */}
          {confirmOpen && (
            <ConfirmDispatch
              compose={compose}
              onConfirm={handleConfirmSend}
              onCancel={() => setConfirmOpen(false)}
            />
          )}
        </div>

        {/* ── Send Log ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Send Log</h4>
            <span className="text-xs text-muted-foreground font-mono">{log.length} messages</span>
          </div>
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-0.5">
            {log.map((msg) => (
              <CommLogCard
                key={msg.id}
                msg={msg}
                expanded={expandedId === msg.id}
                onToggle={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SkipTraceTableRow({
  contact,
  onSelect,
}: {
  contact: SkipTraceAddressEntry
  onSelect: () => void
}) {
  const cityLine = contact.addressLocality ?? (contact.livesIn ? contact.livesIn.split(',')[0].trim() : null)
  const cityStateZip = [cityLine, contact.addressRegion, contact.postalCode].filter(Boolean).join(', ')
  const displayName = contact.fullName ?? (contact.livesIn ? `Contact near ${contact.livesIn}` : 'Unknown contact')
  const contactPoint = contact.phones[0]?.number ?? contact.emails[0] ?? 'No contact'

  return (
    <tr
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      className="cursor-pointer border-b border-border/60 last:border-b-0 hover:bg-primary/5 focus:bg-primary/5 focus:outline-none"
      title="Click to fill the compose message"
    >
      <td className="px-3 py-2 align-top">
        <p className="font-medium leading-tight text-foreground">{contact.streetAddress || 'Unknown address'}</p>
        {cityStateZip && <p className="truncate text-[10px] text-muted-foreground">{cityStateZip}</p>}
      </td>
      <td className="max-w-[120px] px-3 py-2 text-right align-top">
        <p className="truncate font-medium text-foreground">{displayName}</p>
        <p className="truncate text-[10px] text-muted-foreground">{contactPoint}</p>
      </td>
    </tr>
  )
}

// ─── Confirm Dispatch panel ───────────────────────────────────────────────────

function ConfirmDispatch({
  compose,
  onConfirm,
  onCancel,
}: {
  compose: ComposeState
  onConfirm: () => void
  onCancel: () => void
}) {
  const chCfg = CHANNEL_CONFIG[compose.channel]
  const ChIcon = chCfg.icon

  return (
    <div className="bg-card border border-[oklch(0.78_0.16_80_/_35%)] rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-[oklch(0.78_0.16_80_/_15%)] border border-[oklch(0.78_0.16_80_/_30%)] flex items-center justify-center shrink-0">
          <AlertCircle className="w-4.5 h-4.5 text-[oklch(0.78_0.16_80)]" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Confirm Dispatch</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review recipient details before sending. This action cannot be undone.
          </p>
        </div>
      </div>

      <div className="bg-secondary/40 rounded-lg border border-border p-3 space-y-2 text-xs">
        <Row label="Channel">
          <span className={cn('inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full border', chCfg.className)}>
            <ChIcon className="w-3 h-3" />
            {chCfg.label}
          </span>
        </Row>
        <Row label="To">{compose.recipientName}</Row>
        {compose.recipientEmail && <Row label="Email">{compose.recipientEmail}</Row>}
        {compose.recipientPhone && <Row label="Phone">{compose.recipientPhone}</Row>}
        {compose.subject && <Row label="Subject">{compose.subject}</Row>}
        <Row label="Body">
          <span className="text-muted-foreground line-clamp-2">{compose.body}</span>
        </Row>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" className="flex-1 text-sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1 text-sm gap-2" onClick={onConfirm}>
          <Send className="w-4 h-4" />
          Confirm & Send
        </Button>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground w-14 shrink-0 pt-0.5">{label}</span>
      <span className="text-foreground font-medium">{children}</span>
    </div>
  )
}

// ─── Comm Log Card ────────────────────────────────────────────────────────────

function CommLogCard({
  msg,
  expanded,
  onToggle,
}: {
  msg: CommMessage
  expanded: boolean
  onToggle: () => void
}) {
  const chCfg = CHANNEL_CONFIG[msg.channel]
  const ChIcon = chCfg.icon
  const stCfg = STATUS_CONFIG[msg.status]
  const StIcon = stCfg.icon

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden transition-colors hover:border-border/80 cursor-pointer',
        expanded && 'border-primary/25'
      )}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Channel icon */}
        <div className={cn(
          'w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5',
          chCfg.className
        )}>
          <ChIcon className="w-3.5 h-3.5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">{msg.recipientName}</span>
            <span className={cn('flex items-center gap-1 text-[10px] font-semibold', stCfg.className)}>
              <StIcon className="w-3 h-3" />
              {stCfg.label}
            </span>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{msg.id}</span>
          </div>
          {msg.subject && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.subject}</p>
          )}
          <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-0.5">{msg.body}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground/60">
              {msg.sentAt ? formatDateTime(msg.sentAt) : 'Queued — ' + formatDateTime(msg.createdAt)}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-border/50 pt-2.5 space-y-2">
          {msg.recipientEmail && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AtSign className="w-3 h-3" />
              {msg.recipientEmail}
            </div>
          )}
          {msg.recipientPhone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="w-3 h-3" />
              {msg.recipientPhone}
            </div>
          )}
          <div className="bg-secondary/40 rounded-lg px-3 py-2.5 text-xs text-foreground leading-relaxed">
            {msg.body}
          </div>
          {msg.status === 'failed' && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <Info className="w-3 h-3" />
              Delivery failed. Webhook timeout — click retry to resend.
            </div>
          )}
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 w-full mt-1">
            <Send className="w-3 h-3" />
            {msg.status === 'failed' ? 'Retry Send' : 'Resend'}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Form Field wrapper ───────────────────────────────────────────────────────

function FormField({
  label,
  icon,
  error,
  children,
}: {
  label: string
  icon?: React.ReactNode
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
