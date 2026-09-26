import { NextResponse } from 'next/server'

function getEnv() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  return { supabaseUrl, serviceKey }
}

export async function GET(request: Request) {
  const { supabaseUrl, serviceKey } = getEnv()
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Supabase server configuration is missing' }, { status: 500 })
  const propertyLeadId = Number(new URL(request.url).searchParams.get('property_lead_id'))
  if (!Number.isInteger(propertyLeadId)) return NextResponse.json({ error: 'property_lead_id is required' }, { status: 400 })

  const response = await fetch(
    `${supabaseUrl}/rest/v1/conversations?property_lead_id=eq.${propertyLeadId}&select=*&order=occurred_at.desc`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  const rows = await response.json().catch(() => [])
  if (!response.ok) return NextResponse.json({ error: 'Unable to load conversations', detail: rows }, { status: 502 })
  return NextResponse.json({ rows: Array.isArray(rows) ? rows : [] })
}

export async function POST(request: Request) {
  const { supabaseUrl, serviceKey } = getEnv()
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Supabase server configuration is missing' }, { status: 500 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const propertyLeadId = Number(body.property_lead_id)
  const summary = String(body.summary ?? '').trim()
  if (!Number.isInteger(propertyLeadId) || !summary) {
    return NextResponse.json({ error: 'property_lead_id and summary are required' }, { status: 400 })
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/conversations`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      property_lead_id: propertyLeadId,
      occurred_at: body.occurred_at || new Date().toISOString(),
      channel: body.channel ?? null,
      summary,
      outcome: body.outcome ?? null,
      next_step: body.next_step ?? null,
    }),
  })
  const rows = await response.json().catch(() => [])
  if (!response.ok) return NextResponse.json({ error: 'Unable to save conversation', detail: rows }, { status: 502 })
  return NextResponse.json({ ok: true, result: Array.isArray(rows) ? rows[0] : rows })
}
