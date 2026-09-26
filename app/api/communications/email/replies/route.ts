import { NextResponse } from 'next/server'
import { getEmailThreads, getEmailThread, addReplyToThread } from '@/lib/email'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId')

    if (threadId) {
      const thread = getEmailThread(threadId)
      if (!thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
      }
      return NextResponse.json({ thread })
    }

    const threads = getEmailThreads()
    return NextResponse.json({ threads })
  } catch (error) {
    console.error('Email fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { threadId, from, subject, body: emailBody } = body

    if (!threadId || !from || !subject || !emailBody) {
      return NextResponse.json({ error: 'Missing required fields: threadId, from, subject, body' }, { status: 400 })
    }

    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const dateString = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    const reply = addReplyToThread(threadId, {
      from,
      to: 'me',
      subject,
      body: emailBody,
      time: `${dateString} ${timeString}`,
    })

    if (!reply) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: reply })
  } catch (error) {
    console.error('Email reply error:', error)
    return NextResponse.json({ error: 'Failed to add reply' }, { status: 500 })
  }
}
