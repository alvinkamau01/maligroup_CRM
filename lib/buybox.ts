export type PipelineStage = 'new_match' | 'skip_traced' | 'conversed' | 'under_contract'

export const STAGE_ORDER: PipelineStage[] = ['new_match', 'skip_traced', 'conversed', 'under_contract']

export const STAGE_LABELS: Record<PipelineStage, string> = {
  new_match: 'New matches',
  skip_traced: 'Skip traced',
  conversed: 'In conversation',
  under_contract: 'Under contract',
}

export const STAGE_DESCRIPTIONS: Record<PipelineStage, string> = {
  new_match: 'Fresh Buy Box matches waiting on skip trace',
  skip_traced: 'Contact info found, ready to reach out',
  conversed: 'Seller has been contacted at least once',
  under_contract: 'Contract sent and tracked to close',
}

export interface PropertyTypeOption {
  value: string
  label: string
}

export const PROPERTY_TYPE_OPTIONS: PropertyTypeOption[] = [
  { value: 'SFR', label: 'Single family' },
  { value: 'CONDO', label: 'Condo' },
  { value: 'MFH_2_TO_4', label: 'Multifamily (2-4)' },
  { value: 'MOBILE', label: 'Mobile home' },
  { value: 'LAND', label: 'Land' },
  { value: 'COMMERCIAL', label: 'Commercial' },
]

export interface LeadTypeOption {
  value: string
  label: string
  group: 'equity' | 'ownership' | 'distress' | 'financing'
}

export const LEAD_TYPE_OPTIONS: LeadTypeOption[] = [
  { value: 'high_equity', label: 'High equity', group: 'equity' },
  { value: 'low_equity', label: 'Low equity', group: 'equity' },
  { value: 'negative_equity', label: 'Negative equity', group: 'equity' },
  { value: 'free_and_clear', label: 'Free and clear', group: 'equity' },
  { value: 'absentee_owner', label: 'Absentee owner', group: 'ownership' },
  { value: 'out_of_state_owner', label: 'Out of state owner', group: 'ownership' },
  { value: 'tired_landlord', label: 'Tired landlord', group: 'ownership' },
  { value: 'empty_nester', label: 'Empty nester', group: 'ownership' },
  { value: 'flipped_property', label: 'Flipped property', group: 'ownership' },
  { value: 'intrafamily_transfer', label: 'Intrafamily transfer', group: 'ownership' },
  { value: 'vacant_home', label: 'Vacant home', group: 'distress' },
  { value: 'vacant_lot', label: 'Vacant lot', group: 'distress' },
  { value: 'zombie_property', label: 'Zombie property', group: 'distress' },
  { value: 'preforeclosure', label: 'Pre-foreclosure', group: 'distress' },
  { value: 'bank_owned', label: 'Bank owned', group: 'distress' },
  { value: 'mls_failed', label: 'Expired / failed listing', group: 'distress' },
  { value: 'mls_active', label: 'Active listing', group: 'distress' },
  { value: 'adjustable_loan', label: 'Adjustable loan', group: 'financing' },
  { value: 'assumable_loan', label: 'Assumable loan', group: 'financing' },
  { value: 'private_lender', label: 'Private lender', group: 'financing' },
  { value: 'cash_buyer', label: 'Cash buyer', group: 'financing' },
]

export interface LocationQuery {
  cities: { city: string; state: string }[]
  zips: string[]
  states: string[]
  raw: string
}

const US_STATE_ABBR = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA',
  'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
])

/** Parses a free-text location query (comma or newline separated) into cities, states, and zips. */
export function parseLocationsQuery(input: string): LocationQuery {
  const raw = input.trim()
  const tokens = raw
    .split(/[\n;]+/)
    .flatMap((line) => line.split(','))
    .map((token) => token.trim())
    .filter(Boolean)

  const cities: { city: string; state: string }[] = []
  const zips: string[] = []
  const states: string[] = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (/^\d{5}$/.test(token)) {
      zips.push(token)
      continue
    }
    const stateOnly = token.toUpperCase()
    if (US_STATE_ABBR.has(stateOnly) && token.length <= 2) {
      states.push(stateOnly)
      continue
    }
    // "City State" or "City ST" pattern within a single comma segment
    const cityStateMatch = token.match(/^(.+?)\s+([A-Za-z]{2})$/)
    const next = tokens[i + 1]?.toUpperCase().trim()
    if (next && US_STATE_ABBR.has(next) && next.length <= 2) {
      cities.push({ city: token, state: next })
      i++
      continue
    }
    if (cityStateMatch && US_STATE_ABBR.has(cityStateMatch[2].toUpperCase())) {
      cities.push({ city: cityStateMatch[1].trim(), state: cityStateMatch[2].toUpperCase() })
      continue
    }
    if (token) cities.push({ city: token, state: '' })
  }

  return { cities, zips, states, raw }
}

export interface FinancialInputs {
  estimatedValue: number
  lastSoldPrice: number
  squareFeet: number
  yearBuilt: number
  taxAssessedTotal: number
}

export interface FinancialSummary {
  arv: number
  repairEstimate: number
  repairPerSf: number
  maxAllowableOffer: number
  suggestedOffer: number
  wholesaleFee: number
}

const MAO_FACTOR = 0.7
const DEFAULT_WHOLESALE_FEE = 8000

/** Derives a quick ARV / repair / MAO estimate from what the lead record already has (70% rule). */
export function computeFinancials(input: FinancialInputs): FinancialSummary {
  const arv = input.estimatedValue > 0 ? input.estimatedValue : input.lastSoldPrice * 1.15
  const age = input.yearBuilt > 0 ? Math.max(0, new Date().getFullYear() - input.yearBuilt) : 25
  const repairPerSf = age > 40 ? 28 : age > 20 ? 18 : age > 10 ? 10 : 5
  const sf = input.squareFeet > 0 ? input.squareFeet : 1500
  const repairEstimate = Math.round(repairPerSf * sf)
  const maxAllowableOffer = Math.max(0, Math.round(arv * MAO_FACTOR - repairEstimate))
  const suggestedOffer = Math.max(0, maxAllowableOffer - DEFAULT_WHOLESALE_FEE)
  return {
    arv: Math.round(arv),
    repairEstimate,
    repairPerSf,
    maxAllowableOffer,
    suggestedOffer,
    wholesaleFee: DEFAULT_WHOLESALE_FEE,
  }
}

export function formatCompactCurrency(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export interface PipelineRow {
  propertyLeadId: number
  sourceId: number | null
  address: string
  city: string
  state: string
  zip: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  livingAreaSf: number
  yearBuilt: number
  estimatedValue: number
  estimatedEquity: number
  estimatedEquityPercentage: number
  lastSoldPrice: number
  lastSoldDate: string
  mlsStatus: string
  daysOnMarket: number
  leadTypes: string[]
  ownerName: string
  ownerOccupied: boolean
  companyOwned: boolean
  individualOwned: boolean
  trustOwned: boolean
  latitude: number
  longitude: number
  createdAt: string
  skiptraceId: number | null
  skiptracedAt: string | null
  conversationCount: number
  lastConversationAt: string | null
  contractCount: number
  anySent: boolean
  anyReplied: boolean
  stage: PipelineStage
}

export function mapPipelineRow(row: Record<string, unknown>): PipelineRow {
  return {
    propertyLeadId: Number(row.propertyLeadId ?? row.property_lead_id ?? row.id ?? 0),
    sourceId: row.sourceId == null && row.source_id == null && row.id == null
      ? 101
      : Number(row.sourceId ?? row.source_id ?? row.id),
    address: String(row.address ?? ''),
    city: String(row.city ?? ''),
    state: String(row.state ?? ''),
    zip: String(row.zip ?? ''),
    propertyType: String(row.propertyType ?? row.property_type ?? ''),
    bedrooms: Number(row.bedrooms ?? 0),
    bathrooms: Number(row.bathrooms ?? 0),
    livingAreaSf: Number(row.livingAreaSf ?? row.living_area_sf ?? 0),
    yearBuilt: Number(row.yearBuilt ?? row.year_built ?? 0),
    estimatedValue: Number(row.estimatedValue ?? row.estimated_value ?? 0),
    estimatedEquity: Number(row.estimatedEquity ?? row.estimated_equity ?? 0),
    estimatedEquityPercentage: Number(row.estimatedEquityPercentage ?? row.estimated_equity_percentage ?? 0),
    lastSoldPrice: Number(row.lastSoldPrice ?? row.last_sold_price ?? 0),
    lastSoldDate: String(row.lastSoldDate ?? row.last_sold_date ?? ''),
    mlsStatus: String(row.mlsStatus ?? row.mls_status ?? ''),
    daysOnMarket: Number(row.daysOnMarket ?? row.days_on_market ?? 0),
    leadTypes: Array.isArray(row.leadTypes)
      ? (row.leadTypes as string[])
      : Array.isArray(row.lead_types)
        ? (row.lead_types as string[])
        : [],
    ownerName: String(row.ownerName ?? row.owner_name ?? 'Unknown owner'),
    ownerOccupied: Boolean(row.ownerOccupied ?? row.owner_occupied),
    companyOwned: Boolean(row.companyOwned ?? row.company_owned),
    individualOwned: row.individualOwned !== undefined ? Boolean(row.individualOwned) : row.individual_owned !== undefined ? Boolean(row.individual_owned) : true,
    trustOwned: Boolean(row.trustOwned ?? row.trust_owned),
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    createdAt: String(row.createdAt ?? row.created_at ?? row.scrapedAt ?? ''),
    skiptraceId: (row.skiptraceId ?? row.skiptrace_id) != null
      ? Number(row.skiptraceId ?? row.skiptrace_id)
      : null,
    skiptracedAt: (row.skiptracedAt ?? row.skiptraced_at) != null
      ? String(row.skiptracedAt ?? row.skiptraced_at)
      : null,
    conversationCount: Number(row.conversationCount ?? row.conversation_count ?? 0),
    lastConversationAt: (row.lastConversationAt ?? row.last_conversation_at) != null
      ? String(row.lastConversationAt ?? row.last_conversation_at)
      : null,
    contractCount: Number(row.contractCount ?? row.contract_count ?? 0),
    anySent: Boolean(row.anySent ?? row.any_sent),
    anyReplied: Boolean(row.anyReplied ?? row.any_replied),
    stage: (row.stage as PipelineStage) ?? 'new_match',
  }
}
