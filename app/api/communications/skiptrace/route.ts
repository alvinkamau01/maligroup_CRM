import { NextResponse } from 'next/server'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

type RawContactInfo = {
  id: number
  source_id: number | null
  created_at: string
  full_name: unknown
  age: unknown
  born: unknown
  lives_in: unknown
  street_address: unknown
  address_locality: unknown
  address_region: unknown
  postal_code: unknown
  county_name: unknown
  current_address_date_range: unknown
  email1: unknown
  email2: unknown
  email3: unknown
  email4: unknown
  email5: unknown
  phone1: unknown
  phone1_type: unknown
  phone2: unknown
  phone2_type: unknown
  phone3: unknown
  phone3_type: unknown
  phone4: unknown
  phone4_type: unknown
  phone5: unknown
  'phone5-type': unknown
}

export type SkipTraceAddressEntry = {
  entryId: string
  contactInfoId: number
  fullName: string | null
  age: number | null
  born: string | null
  livesIn: string | null
  streetAddress: string | null
  addressLocality: string | null
  addressRegion: string | null
  postalCode: string | null
  countyName: string | null
  dateRange: string | null
  emails: string[]
  phones: { number: string; type: string | null }[]
  createdAt: string
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (value === null || value === undefined || value === '') return []
  return [value]
}

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const str = String(value).trim()
  return str.length > 0 ? str : null
}

function normalizeKey(value: string | null): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function flattenRow(row: RawContactInfo): SkipTraceAddressEntry[] {
  const names = toArray(row.full_name)
  const ages = toArray(row.age)
  const borns = toArray(row.born)
  const livesIns = toArray(row.lives_in)
  const streets = toArray(row.street_address)
  const localities = toArray(row.address_locality)
  const regions = toArray(row.address_region)
  const postalCodes = toArray(row.postal_code)
  const counties = toArray(row.county_name)
  const dateRanges = toArray(row.current_address_date_range)

  const emailLists = [row.email1, row.email2, row.email3, row.email4, row.email5].map(toArray)
  const phoneLists = [row.phone1, row.phone2, row.phone3, row.phone4, row.phone5].map(toArray)
  const phoneTypeLists = [row.phone1_type, row.phone2_type, row.phone3_type, row.phone4_type, row['phone5-type']].map(toArray)

  const entryCount = Math.max(streets.length, livesIns.length, 1)
  const fallbackName = toStringOrNull(names[0])

  const entries: SkipTraceAddressEntry[] = []

  for (let index = 0; index < entryCount; index++) {
    const streetAddress = toStringOrNull(streets[index])
    const livesIn = toStringOrNull(livesIns[index])
    if (!streetAddress && !livesIn) continue

    const emails = emailLists
      .map((list) => toStringOrNull(list[index]))
      .filter((email): email is string => Boolean(email))

    const phones = phoneLists
      .map((list, phoneIndex) => {
        const number = toStringOrNull(list[index])
        if (!number) return null
        return { number, type: toStringOrNull(phoneTypeLists[phoneIndex][index]) }
      })
      .filter((phone): phone is { number: string; type: string | null } => Boolean(phone))

    entries.push({
      entryId: `${row.id}-${index}`,
      contactInfoId: row.id,
      fullName: fallbackName,
      age: ages[index] !== undefined && ages[index] !== null ? Number(ages[index]) : null,
      born: toStringOrNull(borns[index]),
      livesIn,
      streetAddress,
      addressLocality: toStringOrNull(localities[index]),
      addressRegion: toStringOrNull(regions[index]),
      postalCode: toStringOrNull(postalCodes[index]),
      countyName: toStringOrNull(counties[index]),
      dateRange: toStringOrNull(dateRanges[index]),
      emails,
      phones,
      createdAt: row.created_at,
    })
  }

  return entries
}

export async function GET() {
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 })
  }

  const params = new URLSearchParams({
    select:
      'id,source_id,created_at,full_name,age,born,lives_in,street_address,address_locality,address_region,postal_code,county_name,current_address_date_range,email1,email2,email3,email4,email5,phone1,phone1_type,phone2,phone2_type,phone3,phone3_type,phone4,phone4_type,phone5,"phone5-type"',
    order: 'created_at.desc,id.desc',
    limit: '500',
  })
  const response = await fetch(`${supabaseUrl}/rest/v1/ContactInfo?${params.toString()}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: 'no-store',
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Unable to load skip-traced data.' }, { status: response.status })
  }

  const rawRows = (await response.json()) as RawContactInfo[]
  const allEntries = rawRows.flatMap(flattenRow)

  const byKey = new Map<string, SkipTraceAddressEntry>()
  for (const entry of allEntries) {
    const key = `${normalizeKey(entry.streetAddress)}|${normalizeKey(entry.addressRegion)}|${normalizeKey(entry.postalCode)}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, entry)
      continue
    }
    // Prefer the entry with more complete data (a real name, more contact points).
    const existingScore = (existing.fullName ? 1 : 0) + existing.emails.length + existing.phones.length
    const candidateScore = (entry.fullName ? 1 : 0) + entry.emails.length + entry.phones.length
    if (candidateScore > existingScore) byKey.set(key, entry)
  }

  const rows = Array.from(byKey.values()).sort((a, b) => {
    const addressA = a.streetAddress ?? ''
    const addressB = b.streetAddress ?? ''
    return addressA.localeCompare(addressB)
  })

  return NextResponse.json({ rows })
}
