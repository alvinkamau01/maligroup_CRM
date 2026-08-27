import { NextResponse } from 'next/server'

const ALLOWED_WEBHOOK = process.env.N8N_SKIPTRACE_WEBHOOK_URL || ''

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams
  const propertyLeadId = Number(query.get('property_lead_id'))
  const sourceId = query.get('source_id')
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !serviceKey || !Number.isInteger(propertyLeadId)) return NextResponse.json({ result: null }, { status: 400 })
  const filter = sourceId ? `source_id=eq.${encodeURIComponent(sourceId)}` : `property_lead_id=eq.${propertyLeadId}`
  const contactResponse = await fetch(`${supabaseUrl}/rest/v1/ContactInfo?${filter}&select=*`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' })
  const contactRows = await contactResponse.json().catch(() => [])
  if (contactResponse.ok && Array.isArray(contactRows) && contactRows[0]) return NextResponse.json({ result: contactRows[0], source: 'ContactInfo' })
  const response = await fetch(`${supabaseUrl}/rest/v1/skiptrace?property_lead_id=eq.${propertyLeadId}&select=*`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' })
  const rows = await response.json().catch(() => [])
  return NextResponse.json({ result: Array.isArray(rows) ? rows[0] ?? null : null, source: 'skiptrace' }, { status: response.ok ? 200 : 502 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (body.workflow !== 'skiptrace') return NextResponse.json({ error: 'Invalid workflow' }, { status: 400 })
    const ownershipType = String(body.ownership_type ?? '').trim().toLowerCase()
    if (ownershipType !== 'individual') return NextResponse.json({ error: 'Buyer workflow is not configured yet for company or trust ownership.' }, { status: 409 })
    const nameQuery = String(body.name_query ?? '').trim()
    const addressQuery = String(body.address_query ?? '').trim()
    const propertyLeadId = Number(body.property_lead_id)
    if (!nameQuery || !addressQuery || !Number.isInteger(propertyLeadId)) return NextResponse.json({ error: 'Missing seller or property details' }, { status: 400 })

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
    if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Supabase server configuration is missing' }, { status: 500 })
    const supabaseHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    const existingResponse = await fetch(`${supabaseUrl}/rest/v1/skiptrace?property_lead_id=eq.${propertyLeadId}&select=*`, { headers: supabaseHeaders, cache: 'no-store' })
    const existingRows = await existingResponse.json().catch(() => [])
    if (existingResponse.ok && Array.isArray(existingRows) && existingRows[0]) return NextResponse.json({ ok: true, cached: true, result: existingRows[0] })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90000)
    let response: Response
    try {
      response = await fetch(ALLOWED_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ max_results: 1, name: [nameQuery], street_citystatezip: [addressQuery] }), signal: controller.signal })
    } finally {
      clearTimeout(timeout)
    }
    const responseText = await response.text()
    let responseData: unknown = null
    try { responseData = responseText ? JSON.parse(responseText) : null } catch { responseData = responseText ? { raw: responseText } : null }
    if (response.ok && responseData && typeof responseData === 'object') {
      const result = Array.isArray(responseData) ? responseData[0] : (responseData as Record<string, unknown>).result ?? (responseData as Record<string, unknown>).data ?? responseData
      const record = Array.isArray(result) ? result[0] : result
      if (record && typeof record === 'object') {
        const row = record as Record<string, unknown>
        await fetch(`${supabaseUrl}/rest/v1/skiptrace`, { method: 'POST', headers: { ...supabaseHeaders, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify({ property_lead_id: propertyLeadId, full_name: row.full_name ?? null, first_name: row.first_name ?? null, last_name: row.last_name ?? null, age: row.age ?? row.Age ?? null, born: row.born ?? null, lives_in: row.lives_in ?? row['Lives in'] ?? null, street_address: row['Street Address'] ?? null, address_locality: row['Address Locality'] ?? null, address_region: row['Address Region'] ?? null, postal_code: row['Postal Code'] ?? null, email1: row.email1 ?? row['Email-1'] ?? null, email2: row.email2 ?? row['Email-2'] ?? null, email3: row.email3 ?? row['Email-3'] ?? null, email4: row.email4 ?? row['Email-4'] ?? null, email5: row.email5 ?? row['Email-5'] ?? null, phone1: row.phone1 ?? row['Phone-1'] ?? null, phone1_type: row.phone1_type ?? null, phone2: row.phone2 ?? row['Phone-2'] ?? null, phone2_type: row.phone2_type ?? null, phone3: row.phone3 ?? row['Phone-3'] ?? null, phone3_type: row.phone3_type ?? null, phone4: row.phone4 ?? row['Phone-4'] ?? null, phone4_type: row.phone4_type ?? null, phone5: row.phone5 ?? row['Phone-5'] ?? null, phone5_type: row.phone5_type ?? row['phone5-type'] ?? null, raw: row }) })
      }
    }
    return NextResponse.json({ ok: response.ok, cached: false, result: responseData }, { status: response.ok ? 200 : 502 })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return NextResponse.json({ error: 'Skip-tracing workflow timed out. Configure n8n to return a response from Respond to Webhook.' }, { status: 504 })
    return NextResponse.json({ error: 'Unable to trigger workflow' }, { status: 500 })
  }
}
