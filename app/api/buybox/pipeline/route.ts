import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Supabase server configuration is missing' }, { status: 500 })

  const query = new URL(request.url).searchParams
  const params = new URLSearchParams()
  params.set('select', '*')
  params.set('order', 'created_at.desc')
  params.set('limit', '500')

  const cities = query.getAll('city')
  const states = query.getAll('state')
  const zips = query.getAll('zip')
  const leadTypes = query.getAll('lead_type')
  const propertyTypes = query.getAll('property_type')
  const stage = query.get('stage')
  const search = query.get('q')?.trim()

  const orClauses: string[] = []
  if (cities.length) orClauses.push(...cities.map((city) => `city.ilike.${encodeURIComponent(`*${city}*`)}`))
  if (zips.length) orClauses.push(...zips.map((zip) => `zip.eq.${encodeURIComponent(zip)}`))
  if (search) orClauses.push(`address.ilike.${encodeURIComponent(`*${search}*`)}`, `owner_name.ilike.${encodeURIComponent(`*${search}*`)}`)
  if (orClauses.length) params.set('or', `(${orClauses.join(',')})`)
  if (states.length) params.set('state', `in.(${states.join(',')})`)
  if (propertyTypes.length) params.set('property_type', `in.(${propertyTypes.join(',')})`)
  if (stage) params.set('stage', `eq.${stage}`)
  if (leadTypes.length) params.set('lead_types', `ov.{${leadTypes.join(',')}}`)

  const response = await fetch(`${supabaseUrl}/rest/v1/lead_pipeline?${params.toString()}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: 'no-store',
  })
  const rows = await response.json().catch(() => [])
  if (!response.ok) return NextResponse.json({ error: 'Unable to load Buy Box pipeline', detail: rows }, { status: 502 })
  return NextResponse.json({ rows: Array.isArray(rows) ? rows : [] })
}
