import { createClient } from '@/lib/supabase/client'

export type LeadKind = 'seller' | 'buyer'

export function mapLead(kind: LeadKind, row: Record<string, unknown>) {
  const units = Number(row.units ?? 0)
  const ownershipType = row.company_owned ? 'company' : row.trust_owned ? 'trust' : 'individual'
  return {
    id: String(row.id),
    sourceId: String(row.source_id ?? ''),
    kind,
    ownerName: String(row.owner_name ?? 'Unknown owner'),
    ownershipType,
    address: String(row.address ?? ''),
    city: String(row.city ?? ''),
    state: String(row.state ?? ''),
    zip: String(row.zip ?? ''),
    units,
    estimatedValue: Number(row.estimated_value ?? 0),
    equity: Number(row.estimated_equity_percentage ?? 0),
    lastSoldPrice: Number(row.last_sold_price ?? 0),
    yearsOfOwnership: Number(row.years_of_ownership ?? 0),
    ownerOccupied: Boolean(row.owner_occupied),
    mailingAddress: String(row.owner_mailing_address ?? ''),
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    bedrooms: Number(row.bedrooms ?? 0),
    bathrooms: Number(row.bathrooms ?? 0),
    livingAreaSf: Number(row.living_area_sf ?? 0),
    lotSizeAcres: Number(row.lot_size_acres ?? 0),
    yearBuilt: Number(row.year_built ?? 0),
    propertyType: String(row.property_type ?? ''),
    leadTypes: Array.isArray(row.lead_types) ? row.lead_types : [],
    raw: row,
  }
}

export async function fetchLeads(kind: LeadKind, id?: string) {
  const supabase = createClient()
  let query = supabase.from('property_leads').select('*')
  query = kind === 'buyer' ? query.gt('units', 2) : query.lte('units', 2)
  const result = id
    ? await query.eq('id', Number(id)).maybeSingle()
    : await query.order('id', { ascending: false }).limit(100)
  if (result.error) throw result.error
  return id ? (result.data ? mapLead(kind, result.data as Record<string, unknown>) : null) : (result.data ?? []).map((row: Record<string, unknown>) => mapLead(kind, row))
}
