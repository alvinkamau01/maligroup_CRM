'use client'

import { useState, useRef, useEffect } from 'react'
import { Mail, MessageSquare, Send, Search, Phone, Video, MoreVertical, ArrowLeft, Paperclip, Smile, CheckCircle2, Clock, XCircle, AlertCircle, Shield, Reply } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Tabs } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface Message {
  id: number
  text: string
  from: 'me' | 'them'
  time: string
}

interface Contact {
  id: number
  name: string
  avatar: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
  messages: Message[]
}

const MESSAGE_CONTACTS: Contact[] = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    avatar: 'SM',
    lastMessage: 'Are you coming to the meeting tomorrow?',
    time: '10:42 AM',
    unread: 2,
    online: true,
    messages: [
      { id: 1, text: 'Hey! How are you doing?', from: 'them', time: '10:30 AM' },
      { id: 2, text: 'I\'m great, thanks! Just finished the quarterly report.', from: 'me', time: '10:33 AM' },
      { id: 3, text: 'Nice work! The numbers looked solid.', from: 'them', time: '10:35 AM' },
      { id: 4, text: 'Thanks, took a while to pull together.', from: 'me', time: '10:37 AM' },
      { id: 5, text: 'Are you coming to the meeting tomorrow?', from: 'them', time: '10:42 AM' },
    ],
  },
  {
    id: 2,
    name: 'James Okafor',
    avatar: 'JO',
    lastMessage: 'I\'ll send you the files tonight 👍',
    time: '9:15 AM',
    unread: 0,
    online: true,
    messages: [
      { id: 1, text: 'James, did you get the design specs?', from: 'me', time: '8:50 AM' },
      { id: 2, text: 'Yeah I got them. Going through them now.', from: 'them', time: '9:00 AM' },
      { id: 3, text: 'Let me know if anything looks off.', from: 'me', time: '9:05 AM' },
      { id: 4, text: 'I\'ll send you the files tonight 👍', from: 'them', time: '9:15 AM' },
    ],
  },
  {
    id: 3,
    name: 'Priya Sharma',
    avatar: 'PS',
    lastMessage: 'That sounds perfect, let\'s do it!',
    time: 'Yesterday',
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: 'Hey Priya, are you free for lunch Friday?', from: 'me', time: 'Yesterday 12:10 PM' },
      { id: 2, text: 'Friday works! What time were you thinking?', from: 'them', time: 'Yesterday 12:45 PM' },
      { id: 3, text: 'Maybe 12:30? There\'s a new place on King Street.', from: 'me', time: 'Yesterday 1:00 PM' },
      { id: 4, text: 'That sounds perfect, let\'s do it!', from: 'them', time: 'Yesterday 1:03 PM' },
    ],
  },
  {
    id: 4,
    name: 'Design Team',
    avatar: 'DT',
    lastMessage: 'Marcus: The mockups are ready for review',
    time: 'Yesterday',
    unread: 5,
    online: false,
    messages: [
      { id: 1, text: 'Team, sprint planning is at 3pm today', from: 'them', time: 'Yesterday 9:00 AM' },
      { id: 2, text: 'Got it, I\'ll be there', from: 'me', time: 'Yesterday 9:10 AM' },
      { id: 3, text: 'Can we push to 3:30? I have a call.', from: 'them', time: 'Yesterday 9:22 AM' },
      { id: 4, text: '3:30 works for me', from: 'me', time: 'Yesterday 9:25 AM' },
      { id: 5, text: 'The mockups are ready for review', from: 'them', time: 'Yesterday 4:45 PM' },
    ],
  },
  {
    id: 5,
    name: 'Tom Engel',
    avatar: 'TE',
    lastMessage: 'See you at the conference next week',
    time: 'Mon',
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: 'Tom! Good to hear from you.', from: 'me', time: 'Mon 3:00 PM' },
      { id: 2, text: 'Likewise. Are you going to the UX Summit?', from: 'them', time: 'Mon 3:15 PM' },
      { id: 3, text: 'Yes, presenting on Thursday.', from: 'me', time: 'Mon 3:20 PM' },
      { id: 4, text: 'See you at the conference next week', from: 'them', time: 'Mon 3:22 PM' },
    ],
  },
  {
    id: 6,
    name: 'Fatima Al-Hassan',
    avatar: 'FA',
    lastMessage: 'Thank you so much, really appreciate it!',
    time: 'Sun',
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: 'I passed on your recommendation to the team.', from: 'me', time: 'Sun 11:00 AM' },
      { id: 2, text: 'Oh wow, I didn\'t expect that!', from: 'them', time: 'Sun 11:30 AM' },
      { id: 3, text: 'You deserved it. The work speaks for itself.', from: 'me', time: 'Sun 11:35 AM' },
      { id: 4, text: 'Thank you so much, really appreciate it!', from: 'them', time: 'Sun 11:37 AM' },
    ],
  },
]

const AVATAR_COLORS: Record<string, string> = {
  SM: 'bg-[oklch(0.72_0.14_195)]',
  JO: 'bg-[oklch(0.55_0.18_150)]',
  PS: 'bg-[oklch(0.65_0.18_28)]',
  DT: 'bg-[oklch(0.28_0.07_220)]',
  TE: 'bg-[oklch(0.78_0.16_80)]',
  FA: 'bg-[oklch(0.55_0.18_150)]',
}

const AVATAR_COLORS_EMAIL: Record<string, string> = {
  SM: 'bg-[oklch(0.72_0.14_195)]',
  JO: 'bg-[oklch(0.55_0.18_150)]',
  PS: 'bg-[oklch(0.65_0.18_28)]',
  DT: 'bg-[oklch(0.28_0.07_220)]',
  TE: 'bg-[oklch(0.78_0.16_80)]',
  FA: 'bg-[oklch(0.55_0.18_150)]',
}

export function CommunicationsPanel() {
  const [activeTab, setActiveTab] = useState<'email' | 'message'>('email')
  const [messageContacts, setMessageContacts] = useState<Contact[]>(MESSAGE_CONTACTS)
  const [activeMessageId, setActiveMessageId] = useState<number>(1)
  const [messageInput, setMessageInput] = useState('')
  const [emailSearch, setEmailSearch] = useState('')
  const [activeEmailId, setActiveEmailId] = useState<string | null>(null)
  const [emailThreads, setEmailThreads] = useState<any[]>([])
  const [replyInput, setReplyInput] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeMessage = messageContacts.find((c) => c.id === activeMessageId)!

  const filteredEmails = emailThreads.filter((e) =>
    e.from.toLowerCase().includes(emailSearch.toLowerCase()) ||
    e.subject.toLowerCase().includes(emailSearch.toLowerCase())
  )

  const activeEmail = emailThreads.find((e) => e.id === activeEmailId)!

  // Load email threads on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'email') {
      fetch('/api/communications/email/replies')
        .then((res) => res.json())
        .then((data) => {
          if (data.threads) {
            setEmailThreads(data.threads)
            if (data.threads.length > 0 && !activeEmailId) {
              setActiveEmailId(data.threads[0].id)
            }
          }
        })
        .catch((err) => console.error('Failed to load emails:', err))
    }
  }, [activeTab])

  // Poll for new replies every 10 seconds when email tab is active
  useEffect(() => {
    if (activeTab !== 'email' || !activeEmailId) return

    const pollReplies = async () => {
      try {
        const res = await fetch(`/api/communications/email/replies?threadId=${activeEmailId}`)
        const data = await res.json()
        if (data.thread) {
          setEmailThreads((prev) => {
            const exists = prev.find((t) => t.id === data.thread.id)
            if (exists) {
              return prev.map((t) => (t.id === data.thread.id ? data.thread : t))
            }
            return [data.thread, ...prev]
          })
        }
      } catch (err) {
        console.error('Failed to poll replies:', err)
      }
    }

    const interval = setInterval(pollReplies, 10000)
    return () => clearInterval(interval)
  }, [activeTab, activeEmailId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessage?.messages])

  function sendMessage() {
    const text = messageInput.trim()
    if (!text) return
    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const msg: Message = { id: Date.now(), text, from: 'me', time }
    setMessageContacts((prev) =>
      prev.map((c) =>
        c.id === activeMessageId
          ? { ...c, messages: [...c.messages, msg], lastMessage: text, time }
          : c
      )
    )
    setMessageInput('')
  }

  async function sendEmail() {
    if (!activeEmail) return
    const text = replyInput.trim()
    if (!text) return

    setSendingReply(true)
    try {
      const res = await fetch('/api/communications/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: activeEmail.email,
          from: 'Mali Group <maligroup@maligroupco.com>',
          subject: `Re: ${activeEmail.subject}`,
          body: text,
          threadId: activeEmail.id,
        }),
      })

      if (!res.ok) throw new Error('Failed to send')

      // Update local state immediately
      const now = new Date()
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const dateString = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

      setEmailThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== activeEmail.id) return thread
          return {
            ...thread,
            messages: [
              ...thread.messages,
              {
                id: Date.now(),
                from: 'me',
                to: thread.email,
                subject: `Re: ${thread.subject}`,
                body: text,
                time: `${dateString} ${timeString}`,
                direction: 'sent',
              },
            ],
          }
        })
      )
      setReplyInput('')
    } catch (err) {
      console.error('Failed to send email:', err)
      alert('Failed to send email. Please try again.')
    } finally {
      setSendingReply(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Communications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Email and message outreach</p>
        </div>
      </div>

      {/* Dev notice */}
      <div className="px-6 py-2 bg-accent/10 border-b border-accent/20 shrink-0">
        <p className="text-xs text-accent font-medium">Communications is still under development. Some features may not work as expected.</p>
      </div>

      {/* Tabs */}
      <div className="shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('email')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'email'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
          <button
            onClick={() => setActiveTab('message')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'message'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Message
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'email' ? (
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full">
            {/* Column 0: Email contacts history */}
            <div className="w-64 shrink-0 border-r flex flex-col" style={{ borderRightColor: 'var(--border)' }}>
              <div className="px-4 py-3 border-b" style={{ borderBottomColor: 'var(--border)' }}>
                <h3 className="text-sm font-semibold text-foreground">Contacts</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Emailed in the past</p>
              </div>
              <ScrollArea className="flex-1">
                {emailThreads.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No emailed contacts yet.
                  </div>
                ) : (
                  emailThreads.map((email) => (
                    <button
                      key={email.id}
                      onClick={() => setActiveEmailId(email.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b transition-colors',
                        activeEmailId === email.id ? 'bg-secondary' : 'hover:bg-muted/50'
                      )}
                      style={{ borderBottomColor: 'var(--border)' }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className={cn('h-8 w-8 text-white text-xs font-semibold shrink-0', AVATAR_COLORS_EMAIL[email.from.split(' ').map(n => n[0]).join('')] || 'bg-muted')}>
                          {email.from.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{email.from}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{email.email}</p>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{email.subject}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Column 1: Compose email */}
            <div className="w-[420px] shrink-0 border-r flex flex-col" style={{ borderRightColor: 'var(--border)' }}>
              <div className="px-4 py-3 border-b" style={{ borderBottomColor: 'var(--border)' }}>
                <h3 className="text-sm font-semibold text-foreground">New Email</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Compose and send a new email</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">To</label>
                  <Input
                    type="email"
                    placeholder="recipient@example.com"
                    className="h-8 text-xs bg-secondary/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Subject</label>
                  <Input
                    type="text"
                    placeholder="Enter email subject"
                    className="h-8 text-xs bg-secondary/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Message</label>
                  <Textarea
                    placeholder="Write your email here..."
                    className="text-xs bg-secondary/50 resize-none min-h-[200px]"
                    rows={10}
                  />
                </div>
                <Button className="w-full gap-2 text-sm">
                  <Send className="w-3.5 h-3.5" />
                  Send Email
                </Button>
              </div>
            </div>

            {/* Column 2: Email thread */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Thread selector */}
              <div className="px-4 py-2 border-b flex items-center gap-2 overflow-x-auto" style={{ borderBottomColor: 'var(--border)' }}>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0">Threads:</span>
                {emailThreads.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => setActiveEmailId(email.id)}
                    className={cn(
                      'shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                      activeEmailId === email.id
                        ? 'bg-accent text-accent-foreground border-accent'
                        : 'bg-transparent text-muted-foreground border-border hover:border-accent/50 hover:text-foreground'
                    )}
                  >
                    {email.from}
                  </button>
                ))}
              </div>

              {activeEmail ? (
                <>
                  {/* Email header */}
                  <div className="px-6 py-4 border-b" style={{ borderBottomColor: 'var(--border)' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">{activeEmail.subject}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className={cn('h-6 w-6 text-white text-[10px] font-semibold', AVATAR_COLORS_EMAIL[activeEmail.from.split(' ').map(n => n[0]).join('')] || 'bg-muted')}>
                            {activeEmail.from.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </Avatar>
                          <span className="text-xs font-medium text-foreground">{activeEmail.from}</span>
                          <span className="text-xs text-muted-foreground">&lt;{activeEmail.email}&gt;</span>
                          <span className="text-xs text-muted-foreground">to me</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Reply className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Email body */}
                  <ScrollArea className="flex-1 p-6">
                    <div className="max-w-3xl space-y-4">
                      {activeEmail.messages.map((msg: any) => (
                        <Card
                          key={msg.id}
                          className={cn(
                            'p-4 border',
                            msg.from === 'me' ? 'bg-secondary/50' : 'bg-card'
                          )}
                        >
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className={cn('h-8 w-8 text-white text-xs font-semibold', msg.from === 'me' ? 'bg-primary' : 'bg-muted-foreground')}>
                                {msg.from === 'me' ? 'Me' : activeEmail.from.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </Avatar>
                              <div>
                                <p className="text-xs font-semibold text-foreground">
                                  {msg.from === 'me' ? 'Mali Group' : activeEmail.from}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {msg.from === 'me' ? 'maligroup@maligroupco.com' : activeEmail.email}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                          </div>
                          <div className="text-sm text-foreground whitespace-pre-line leading-relaxed pl-10">
                            {msg.body}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Reply */}
                  <div className="px-6 py-4 border-t" style={{ borderBottomColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Textarea
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 min-h-[80px] text-sm resize-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={sendEmail}
                        disabled={sendingReply || !replyInput.trim()}
                      >
                        {sendingReply ? (
                          <>
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Send Reply
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select an email thread to view</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full">
            {/* Contacts sidebar */}
            <div className="w-80 shrink-0 border-r flex flex-col" style={{ borderRightColor: 'var(--border)' }}>
              <div className="p-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search or start new chat"
                    className="w-full h-8 pl-8 pr-3 text-xs rounded-full border border-border bg-background"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {messageContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setActiveMessageId(contact.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 border-b transition-colors text-left',
                      activeMessageId === contact.id ? 'bg-secondary' : 'hover:bg-muted/50',
                      contact.unread > 0 && 'bg-accent/5'
                    )}
                    style={{ borderBottomColor: 'var(--border)' }}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold',
                          AVATAR_COLORS[contact.avatar] || 'bg-muted'
                        )}
                      >
                        {contact.avatar}
                      </div>
                      {contact.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-[oklch(0.55_0.18_150)] border-2 border-background rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground truncate">{contact.name}</span>
                        <span className={cn('text-xs shrink-0 ml-2', contact.unread > 0 ? 'text-accent font-medium' : 'text-muted-foreground')}>
                          {contact.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">{contact.lastMessage}</p>
                        {contact.unread > 0 && (
                          <span className="ml-2 shrink-0 bg-accent text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {contact.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </div>

            {/* Chat panel */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {activeMessage && (
                <>
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ borderBottomColor: 'var(--border)' }}>
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold',
                          AVATAR_COLORS[activeMessage.avatar] || 'bg-muted'
                        )}
                      >
                        {activeMessage.avatar}
                      </div>
                      {activeMessage.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[oklch(0.55_0.18_150)] border-2 border-background rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{activeMessage.name}</p>
                      <p className="text-xs text-muted-foreground">{activeMessage.online ? 'online' : 'last seen recently'}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 overflow-y-auto p-4">
                    <div className="max-w-3xl mx-auto space-y-1">
                      {activeMessage.messages.map((msg, i) => {
                        const isMe = msg.from === 'me'
                        const prevMsg = activeMessage.messages[i - 1]
                        const showDate = !prevMsg

                        return (
                          <div key={msg.id}>
                            {showDate && (
                              <div className="flex justify-center my-4">
                                <span className="bg-secondary text-muted-foreground text-xs px-3 py-1 rounded-full border border-border">
                                  Today
                                </span>
                              </div>
                            )}
                            <div className={cn('flex mb-0.5', isMe ? 'justify-end' : 'justify-start')}>
                              <div
                                className={cn(
                                  'max-w-[65%] rounded-lg px-3 py-2 shadow-sm',
                                  isMe
                                    ? 'bg-accent text-accent-foreground rounded-tr-none'
                                    : 'bg-card text-foreground border border-border rounded-tl-none'
                                )}
                              >
                                <p className="text-sm leading-snug">{msg.text}</p>
                                <div className={cn('flex items-center gap-1 mt-0.5', isMe ? 'justify-end' : 'justify-start')}>
                                  <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                                  {isMe && (
                                    <CheckCircle2 className="w-3 h-3 text-accent" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="px-4 py-3 border-t" style={{ borderBottomColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2 max-w-3xl mx-auto">
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <div className="flex-1 relative">
                        <Input
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                          placeholder="Type a message..."
                          className="h-9 pr-10 text-sm rounded-full border border-border bg-background"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        >
                          <Smile className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        onClick={sendMessage}
                        size="icon"
                        className="h-9 w-9 shrink-0 bg-accent text-accent-foreground hover:bg-accent/85"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
