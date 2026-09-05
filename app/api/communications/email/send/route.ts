import { NextResponse } from 'next/server'
import { createEmailThread } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, from, subject, body: emailBody, threadId } = body

    if (!to || !from || !subject || !emailBody) {
      return NextResponse.json({ error: 'Missing required fields: to, from, subject, body' }, { status: 400 })
    }

    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const dateString = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    if (threadId) {
      // Add reply to existing thread
      const { addReplyToThread } = await import('@/lib/email')
      const reply = addReplyToThread(threadId, {
        from,
        to,
        subject,
        body: emailBody,
        time: `${dateString} ${timeString}`,
      })

      if (!reply) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, message: reply })
    } else {
      // Create new thread
      const thread = createEmailThread({
        from,
        to: Array.isArray(to) ? to[0] : to,
        subject,
        messages: [
          {
            from: 'me',
            to: Array.isArray(to) ? to[0] : to,
            subject,
            body: emailBody,
            time: `${dateString} ${timeString}`,
            direction: 'sent' as const,
          },
        ],
        createdAt: now.toISOString(),
      })

      return NextResponse.json({ success: true, threadId: thread.id })
    }
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
