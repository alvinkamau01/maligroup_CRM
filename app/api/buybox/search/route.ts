import { NextResponse } from 'next/server'

const WEBHOOK = process.env.N8N_BUYBOX_WEBHOOK_URL || ''

interface SearchBody {
  cities: { city: string; state: string }[]
  states: string[]
  zips: string[]
  leadTypes: string[]
  propertyTypes: string[]
}

function toNumber(value: unknown): number | null {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function normalizeLead(record: Record<string, unknown>) {
  const sourceId = String(record.source_id ?? record.id ?? record.property_id ?? '').trim()
  if (!sourceId) return null
  return {
    source_id: sourceId,
    address: record.address ?? record.street_address ?? null,
    city: record.city ?? null,
    state: record.state ?? null,
    zip: record.zip ?? record.postal_code ?? null,
    property_type: record.property_type ?? null,
    bedrooms: toNumber(record.bedrooms),
    bathrooms: toNumber(record.bathrooms),
    living_area_sf: toNumber(record.living_area_sf ?? record.square_feet),
    lot_size_sf: toNumber(record.lot_size_sf),
    units: toNumber(record.units) ?? 1,
    year_built: toNumber(record.year_built),
    estimated_value: toNumber(record.estimated_value),
    estimated_equity: toNumber(record.estimated_equity),
    estimated_equity_percentage: toNumber(record.estimated_equity_percentage),
    estimated_ltv: toNumber(record.estimated_ltv),
    estimated_price_per_sf: toNumber(record.estimated_price_per_sf),
    last_sold_price: toNumber(record.last_sold_price),
    last_sold_date: record.last_sold_date ?? null,
    tax_assessed_total: toNumber(record.tax_assessed_total),
    mls_status: record.mls_status ?? null,
    mls_list_price: toNumber(record.mls_list_price),
    mls_photo_url: record.mls_photo_url ?? null,
    days_on_market: toNumber(record.days_on_market),
    lead_types: Array.isArray(record.lead_types) ? record.lead_types : [],
    owner_name: record.owner_name ?? record.owner_full_name ?? null,
    owner_occupied: Boolean(record.owner_occupied),
    company_owned: Boolean(record.company_owned),
    individual_owned: record.individual_owned !== undefined ? Boolean(record.individual_owned) : true,
    trust_owned: Boolean(record.trust_owned),
    latitude: toNumber(record.latitude),
    longitude: toNumber(record.longitude),
  }
}

export async function POST(request: Request) {
  if (!WEBHOOK) return NextResponse.json({ error: 'Buy Box search workflow is not configured. Set N8N_BUYBOX_WEBHOOK_URL.' }, { status: 500 })

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Supabase server configuration is missing' }, { status: 500 })

  let body: SearchBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const hasLocation = body.cities?.length || body.states?.length || body.zips?.length
  if (!hasLocation) return NextResponse.json({ error: 'Add at least one city, state, or zip code to search.' }, { status: 400 })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90000)
  let response: Response
  try {
    response = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        workflow: 'buybox_search',
        cities: body.cities ?? [],
        states: body.states ?? [],
        zips: body.zips ?? [],
        lead_types: body.leadTypes ?? [],
        property_types: body.propertyTypes ?? [],
      }),
      signal: controller.signal,
    })
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Buy Box search timed out. Try a narrower search.' }, { status: 504 })
    }
    return NextResponse.json({ error: 'Unable to reach the Buy Box search workflow' }, { status: 502 })
  }
  clearTimeout(timeout)

  const responseText = await response.text()
  let payload: unknown = null
  try {
    payload = responseText ? JSON.parse(responseText) : null
  } catch {
    payload = responseText ? { raw: responseText } : null
  }
  if (!response.ok) return NextResponse.json({ error: 'Buy Box search workflow failed', detail: payload }, { status: 502 })

  const rawRecords: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as Record<string, unknown>)?.results)
      ? ((payload as Record<string, unknown>).results as unknown[])
      : Array.isArray((payload as Record<string, unknown>)?.data)
        ? ((payload as Record<string, unknown>).data as unknown[])
        : []

  const leads = rawRecords
    .filter((record): record is Record<string, unknown> => !!record && typeof record === 'object')
    .map(normalizeLead)
    .filter((lead): lead is NonNullable<typeof lead> => lead !== null)

  if (!leads.length) return NextResponse.json({ ok: true, inserted: 0, results: [] })

  const upsertResponse = await fetch(`${supabaseUrl}/rest/v1/property_leads?on_conflict=source_id`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(leads),
  })
  const upsertRows = await upsertResponse.json().catch(() => [])
  if (!upsertResponse.ok) return NextResponse.json({ error: 'Search succeeded but saving leads failed', detail: upsertRows }, { status: 502 })

  return NextResponse.json({ ok: true, inserted: Array.isArray(upsertRows) ? upsertRows.length : 0, results: upsertRows })
}
