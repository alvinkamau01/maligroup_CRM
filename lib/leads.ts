import { createClient } from '@/lib/supabase/client'
import { type PipelineRow } from '@/lib/buybox'
import type { SupabaseClient } from '@supabase/supabase-js'

export type LeadKind = 'seller' | 'buyer'

export interface LeadNote {
  id: number
  property_lead_id: number
  created_by: string | null
  body: string
  created_at: string
  updated_at: string
  author_email?: string | null
}

async function getLeadNotes(supabase: SupabaseClient, propertyLeadId: number): Promise<LeadNote[]> {
  const { data: notes, error } = await supabase
    .from('lead_notes')
    .select('id, property_lead_id, created_by, body, created_at, updated_at')
    .eq('property_lead_id', propertyLeadId)
    .order('created_at', { ascending: true })
  if (error) throw error
  if (!notes?.length) return []

  const authorIds = [...new Set(notes.map((n) => n.created_by).filter((id): id is string => !!id))]
  if (authorIds.length === 0) return notes

  const { data: profiles, error: pErr } = await supabase
    .from('profiles').select('id, email').in('id', authorIds)
  if (pErr) throw pErr
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email as string]))
  return notes.map((n) => ({ ...n, author_email: n.created_by ? emailById.get(n.created_by) ?? null : null }))
}

async function addLeadNote(supabase: SupabaseClient, propertyLeadId: number, body: string): Promise<LeadNote> {
  const trimmed = body.trim()
  if (!trimmed) throw new Error('Comment cannot be empty')
  if (trimmed.length > 4000) throw new Error('Comment exceeds 4000 characters')
  const { data, error } = await supabase
    .from('lead_notes')
    .insert({ property_lead_id: propertyLeadId, body: trimmed })
    .select('id, property_lead_id, created_by, body, created_at, updated_at')
    .single()
  if (error) throw error
  return data
}

async function updateLeadNote(supabase: SupabaseClient, noteId: number, body: string) {
  const trimmed = body.trim()
  if (!trimmed) throw new Error('Comment cannot be empty')
  if (trimmed.length > 4000) throw new Error('Comment exceeds 4000 characters')
  const { data, error } = await supabase
    .from('lead_notes').update({ body: trimmed }).eq('id', noteId)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('not allowed')
}

async function deleteLeadNote(supabase: SupabaseClient, noteId: number) {
  const { data, error } = await supabase
    .from('lead_notes').delete().eq('id', noteId).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('not allowed')
}

export async function fetchLeadNotes(propertyLeadId: number): Promise<LeadNote[]> {
  const supabase = createClient()
  return getLeadNotes(supabase, propertyLeadId)
}



export async function editLeadNote(noteId: number, body: string) {
  const supabase = createClient()
  return updateLeadNote(supabase, noteId, body)
}

export async function removeLeadNote(noteId: number) {
  const supabase = createClient()
  return deleteLeadNote(supabase, noteId)
}

export interface Lead {
  id: string
  sourceId: string
  kind: LeadKind
  ownerName: string
  ownershipType: string
  address: string
  city: string
  state: string
  zip: string
  units: number
  estimatedValue: number
  equity: number
  lastSoldPrice: number
  yearsOfOwnership: number
  ownerOccupied: boolean
  mailingAddress: string
  latitude: number
  longitude: number
  bedrooms: number
  bathrooms: number
  livingAreaSf: number
  lotSizeAcres: number
  yearBuilt: number
  propertyType: string
  leadTypes: string[]
  notesCount: number
  lastNoteAt: string | null
  status: string
  raw: Record<string, unknown>
}

export function mapLead(kind: LeadKind, row: Record<string, unknown>): Lead {
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
    notesCount: Number(row.notesCount ?? row.notes_count ?? 0),
    lastNoteAt: (row.lastNoteAt ?? row.last_note_at) != null ? String(row.lastNoteAt ?? row.last_note_at) : null,
    status: String(row.status ?? 'Call'),
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

export async function fetchAllLeads() {
  const supabase = createClient()
  const result = await supabase.from('property_leads').select('*').order('created_at', { ascending: false }).limit(100)
  if (result.error) throw result.error
  return (result.data ?? []).map((row: Record<string, unknown>) => mapLead(row.company_owned ? 'buyer' : 'seller', row))
}


export async function submitLead(row: PipelineRow) {
  const supabase = createClient()
  const leadKind: LeadKind = row.companyOwned ? 'buyer' : 'seller'
  const { data, error } = await supabase
    .from('property_leads')
    .insert({
      source_id: row.sourceId,
      address: row.address,
      city: row.city,
      state: row.state,
      zip: row.zip,
      property_type: row.propertyType,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      estimated_value: row.estimatedValue,
      estimated_equity: row.estimatedEquity,
      estimated_equity_percentage: row.estimatedEquityPercentage,
      owner_name: row.ownerName,
      owner_occupied: row.ownerOccupied,
      company_owned: row.companyOwned,
      individual_owned: row.individualOwned,
      trust_owned: row.trustOwned,
      latitude: row.latitude,
      longitude: row.longitude,
      living_area_sf: row.livingAreaSf,
      year_built: row.yearBuilt,
      mls_status: row.mlsStatus,
      lead_types: row.leadTypes,
      last_sold_price: row.lastSoldPrice,
      last_sold_date: row.lastSoldDate,
    })
    .select()
    .maybeSingle()
  if (error) throw error
  return data ? mapLead(leadKind, data as Record<string, unknown>) : null
}


export async function updateStatus(id: string | undefined, status: PipelineRow['status']){
  
  const supabase = createClient()
    const {data,error} = await supabase
    .from('property_leads')
    .update({
      status: status
    })
    .eq('id',id)
    .select('status')
    .single()

    if (error) throw error
  
    return data?.status
}

export async function createLeadNote(propertyLeadId: number, body: string): Promise<LeadNote> {
  const supabase = createClient()
  const {data,error}=await supabase
  .from('lead_notes')
  .insert({
    property_lead_id: propertyLeadId,
    body: body
  })

  .select()
  .single()

  if(error) throw error
  
  return data?.body
}