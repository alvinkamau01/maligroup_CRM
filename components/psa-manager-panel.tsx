'use client'

import { useState, useRef, useEffect } from 'react'
import {
  FileText, MessageSquare, Send, Search, Phone, Video, MoreVertical,
  Paperclip, Smile, CheckCircle2, ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ContractEditor } from './contract-editor'

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

const CONTACTS: Contact[] = [
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

export function PSAManagerPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 bg-accent/10 border-b border-accent/20 shrink-0">
        <p className="text-xs text-accent font-medium">PSA Manager is still under development. Some features may not work as expected.</p>
      </div>
      <div className="flex-1 min-h-0">
        <ContractEditor />
      </div>
    </div>
  )
}
