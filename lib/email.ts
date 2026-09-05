export interface EmailMessage {
  id: string
  threadId: string
  from: string
  to: string
  subject: string
  body: string
  time: string
  direction: 'sent' | 'received'
}

export interface EmailThread {
  id: string
  from: string
  email: string
  subject: string
  messages: EmailMessage[]
  createdAt: string
}

// In-memory store for demo purposes. Replace with real email service (Resend, SendGrid, etc.) in production.
const emailThreads: EmailThread[] = []
let emailCounter = 0

export function createEmailThread(thread: Omit<EmailThread, 'id'>): EmailThread {
  emailCounter++
  const newThread: EmailThread = {
    ...thread,
    id: `email-${emailCounter}`,
  }
  emailThreads.push(newThread)
  return newThread
}

export function getEmailThreads(): EmailThread[] {
  return [...emailThreads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getEmailThread(id: string): EmailThread | undefined {
  return emailThreads.find((t) => t.id === id)
}

export function addReplyToThread(threadId: string, message: Omit<EmailMessage, 'id' | 'threadId' | 'direction'>): EmailMessage | undefined {
  const thread = emailThreads.find((t) => t.id === threadId)
  if (!thread) return undefined

  emailCounter++
  const reply: EmailMessage = {
    ...message,
    id: `email-msg-${emailCounter}`,
    threadId,
    direction: 'received',
  }
  thread.messages.push(reply)
  return reply
}
