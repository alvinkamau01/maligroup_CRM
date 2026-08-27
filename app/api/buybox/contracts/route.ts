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
    `${supabaseUrl}/rest/v1/contracts?property_lead_id=eq.${propertyLeadId}&select=*&order=created_at.desc`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
  )
  const rows = await response.json().catch(() => [])
  if (!response.ok) return NextResponse.json({ error: 'Unable to load contracts', detail: rows }, { status: 502 })

  const withUrls = await Promise.all(
    (Array.isArray(rows) ? rows : []).map(async (row: Record<string, unknown>) => {
      const signResponse = await fetch(`${supabaseUrl}/storage/v1/object/sign/contracts/${row.file_path}`, {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: 3600 }),
      })
      const signed = await signResponse.json().catch(() => null)
      return { ...row, signed_url: signed?.signedURL ? `${supabaseUrl}/storage/v1${signed.signedURL}` : null }
    })
  )
  return NextResponse.json({ rows: withUrls })
}

export async function POST(request: Request) {
  const { supabaseUrl, serviceKey } = getEnv()
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Supabase server configuration is missing' }, { status: 500 })

  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })

  const file = formData.get('file')
  const propertyLeadId = Number(formData.get('property_lead_id'))
  const isReply = formData.get('is_reply') === 'true'
  const sellerName = formData.get('seller_name')
  const sellerEmail = formData.get('seller_email')
  const sellerPhone = formData.get('seller_phone')
  const notes = formData.get('notes')

  if (!(file instanceof File)) return NextResponse.json({ error: 'A contract file is required' }, { status: 400 })
  if (!Number.isInteger(propertyLeadId)) return NextResponse.json({ error: 'property_lead_id is required' }, { status: 400 })

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${propertyLeadId}/${Date.now()}-${safeName}`

  const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/contracts/${filePath}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: await file.arrayBuffer(),
  })
  if (!uploadResponse.ok) {
    const detail = await uploadResponse.json().catch(() => null)
    return NextResponse.json({ error: 'Unable to upload contract file', detail }, { status: 502 })
  }

  const insertResponse = await fetch(`${supabaseUrl}/rest/v1/contracts`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      property_lead_id: propertyLeadId,
      file_path: filePath,
      file_name: file.name,
      file_type: file.type || null,
      sent: !isReply,
      replied: isReply,
      is_reply: isReply,
      seller_name: sellerName || null,
      seller_email: sellerEmail || null,
      seller_phone: sellerPhone || null,
      notes: notes || null,
    }),
  })
  const rows = await insertResponse.json().catch(() => [])
  if (!insertResponse.ok) return NextResponse.json({ error: 'File uploaded but saving the record failed', detail: rows }, { status: 502 })

  if (isReply) {
    // Mark any prior outbound contract for this lead as replied.
    await fetch(
      `${supabaseUrl}/rest/v1/contracts?property_lead_id=eq.${propertyLeadId}&is_reply=eq.false`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ replied: true }),
      }
    )
  }

  return NextResponse.json({ ok: true, result: Array.isArray(rows) ? rows[0] : rows })
}
