// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'broker' | 'viewer'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  token: string
  picture?: string
}

export interface PropertyLead {
  id: string
  address: string
  owner: string
  city: string
  county: string
  zip: string
  marketValue: number
  acreage: number
  legalDescription: string
  skipTraceStatus: 'verified' | 'pending' | 'failed'
  propertyStatus: 'vacant' | 'owner-occupied' | 'pre-foreclosure' | 'bank-owned'
  contactPhone?: string
  contactEmail?: string
  createdAt: string
}

export interface FacebookLead {
  id: string
  authorName: string
  authorProfile: string
  postText: string
  postUrl: string
  groupName: string
  keywords: string[]
  phone?: string
  email?: string
  intent: 'buyer' | 'seller' | 'iso' | 'wtb'
  postedAt: string
  includesComment: boolean
  commentText?: string
}

export interface PSAVersion {
  version: string
  createdAt: string
  createdBy: string
  clauses: PSAClause[]
}

export interface PSAClause {
  id: string
  title: string
  content: string
}

export interface PSADocument {
  id: string
  propertyAddress: string
  buyerName: string
  sellerName: string
  purchasePrice: number
  earnestDeposit: number
  closingDate: string
  status: 'draft' | 'sent' | 'countered' | 'executed' | 'expired'
  versions: PSAVersion[]
  createdAt: string
}

export interface DiffChange {
  type: 'added' | 'removed' | 'modified'
  field: string
  oldValue?: string
  newValue?: string
}

export interface CommMessage {
  id: string
  channel: 'email' | 'sms' | 'omnichannel'
  recipientName: string
  recipientEmail?: string
  recipientPhone?: string
  subject?: string
  body: string
  status: 'queued' | 'sent' | 'delivered' | 'failed'
  sentAt?: string
  createdAt: string
}

// ─── Mock Auth Users ──────────────────────────────────────────────────────────

export const MOCK_USERS: AuthUser[] = [
  {
    id: 'usr_001',
    name: 'Marcus Reid',
    email: 'marcus@premierrealty.com',
    role: 'admin',
    token: 'tok_admin_abc123',
  },
  {
    id: 'usr_002',
    name: 'Sandra Howell',
    email: 'sandra@premierrealty.com',
    role: 'broker',
    token: 'tok_broker_xyz789',
  },
  {
    id: 'usr_003',
    name: 'James Caldwell',
    email: 'james@clientview.com',
    role: 'viewer',
    token: 'tok_viewer_def456',
  },
]

// ─── Mock Property Leads ──────────────────────────────────────────────────────

export const MOCK_PROPERTY_LEADS: PropertyLead[] = [
  {
    id: 'PL-001',
    address: '4821 Magnolia Creek Rd',
    owner: 'Dorothy & Frank Ellison',
    city: 'Baton Rouge',
    county: 'East Baton Rouge',
    zip: '70810',
    marketValue: 248000,
    acreage: 1.4,
    legalDescription: 'Lot 12, Block 3, Magnolia Creek Subdivision, EBR Parish',
    skipTraceStatus: 'verified',
    propertyStatus: 'vacant',
    contactPhone: '(225) 555-0142',
    contactEmail: 'f.ellison@gmail.com',
    createdAt: '2026-07-28T10:22:00Z',
  },
  {
    id: 'PL-002',
    address: '209 Old Mill Trace',
    owner: 'Gerald Thibodaux',
    city: 'Prairieville',
    county: 'Ascension',
    zip: '70769',
    marketValue: 315000,
    acreage: 2.1,
    legalDescription: 'Tract 7A, Old Mill Estates, Ascension Parish, LA',
    skipTraceStatus: 'verified',
    propertyStatus: 'pre-foreclosure',
    contactPhone: '(225) 555-0388',
    contactEmail: 'g.thibodaux@yahoo.com',
    createdAt: '2026-07-29T14:15:00Z',
  },
  {
    id: 'PL-003',
    address: '1057 Cypress Bend Ln',
    owner: 'Heirs of Norma Jean Watson',
    city: 'Denham Springs',
    county: 'Livingston',
    zip: '70726',
    marketValue: 187500,
    acreage: 0.75,
    legalDescription: 'Lot 44, Cypress Bend Phase II, Livingston Parish',
    skipTraceStatus: 'pending',
    propertyStatus: 'bank-owned',
    createdAt: '2026-07-30T08:00:00Z',
  },
  {
    id: 'PL-004',
    address: '3390 River Oak Dr',
    owner: 'Patricia Ann Mouton',
    city: 'Gonzales',
    county: 'Ascension',
    zip: '70737',
    marketValue: 432000,
    acreage: 3.8,
    legalDescription: 'Tract 18, River Oak Farms, Ascension Parish, LA',
    skipTraceStatus: 'verified',
    propertyStatus: 'owner-occupied',
    contactPhone: '(225) 555-0701',
    contactEmail: 'patty.mouton@outlook.com',
    createdAt: '2026-07-31T11:45:00Z',
  },
  {
    id: 'PL-005',
    address: '880 Twin Pines Blvd',
    owner: 'Robert & Diane Fontenot',
    city: 'Sorrento',
    county: 'Ascension',
    zip: '70778',
    marketValue: 159000,
    acreage: 0.5,
    legalDescription: 'Lot 6, Block 1, Twin Pines Subdivision, Ascension Parish',
    skipTraceStatus: 'failed',
    propertyStatus: 'vacant',
    createdAt: '2026-08-01T09:10:00Z',
  },
]

// ─── Mock Facebook Leads ──────────────────────────────────────────────────────

export const MOCK_FACEBOOK_LEADS: FacebookLead[] = [
  {
    id: 'FB-001',
    authorName: 'Kevin Broussard',
    authorProfile: 'https://facebook.com/kevin.broussard.realty',
    postText:
      'ISO: Cash buyers for 3/2 in Prairieville, ARV 290k, asking 210k as-is. DM me or call. Motivated!',
    postUrl: 'https://facebook.com/groups/labr/posts/11223344',
    groupName: 'Louisiana Real Estate Investors',
    keywords: ['ISO', 'cash buyer', 'as-is', 'motivated'],
    phone: '(225) 555-0911',
    intent: 'seller',
    postedAt: '2026-08-02T07:30:00Z',
    includesComment: false,
  },
  {
    id: 'FB-002',
    authorName: 'Tanya Moreau',
    authorProfile: 'https://facebook.com/tanya.moreau.invest',
    postText: 'WTB: Single family in EBR or Livingston under 200k. Cash close in 14 days. Serious buyers!',
    postUrl: 'https://facebook.com/groups/labr/posts/11223345',
    groupName: 'Louisiana Real Estate Investors',
    keywords: ['WTB', 'cash close', 'single family'],
    email: 'tanya.moreau@cashbuyers.net',
    phone: '(225) 555-0232',
    intent: 'buyer',
    postedAt: '2026-08-02T09:15:00Z',
    includesComment: true,
    commentText: 'Also open to duplexes or small multifamily. Budget up to 250k.',
  },
  {
    id: 'FB-003',
    authorName: 'Darren St. Pierre',
    authorProfile: 'https://facebook.com/darren.stpierre',
    postText:
      'ISO wholesaler or assignment in Gonzales area. Have 3 cash buyers ready. Looking for off-market deals under 350k.',
    postUrl: 'https://facebook.com/groups/swla/posts/99887766',
    groupName: 'SW Louisiana Deals & Flips',
    keywords: ['ISO', 'wholesaler', 'assignment', 'off-market'],
    phone: '(337) 555-0455',
    intent: 'iso',
    postedAt: '2026-08-01T18:00:00Z',
    includesComment: false,
  },
  {
    id: 'FB-004',
    authorName: 'Monique Leblanc',
    authorProfile: 'https://facebook.com/monique.leblanc.re',
    postText: 'WTB land in Ascension or Tangipahoa. At least 5 acres. Cash. Looking now.',
    postUrl: 'https://facebook.com/groups/labr/posts/11223400',
    groupName: 'Louisiana Real Estate Investors',
    keywords: ['WTB', 'land', 'cash'],
    email: 'monique@landbuyers.io',
    intent: 'wtb',
    postedAt: '2026-07-31T12:00:00Z',
    includesComment: false,
  },
]

export type LeadKind = 'seller' | 'buyer'
export type OwnershipType = 'individual' | 'company' | 'trust'

export interface UnifiedLead {
  id: string
  kind: LeadKind
  ownerName: string
  ownershipType: OwnershipType
  address: string
  city: string
  state: string
  zip: string
  ownerOccupied: boolean
  ownerMailingAddress: string
  ownerMailingCity: string
  ownerMailingState: string
  ownerMailingZip: string
  units: number
  estimatedLtv: number
  estimatedPricePerSf: number
  lastSoldDate: string
  lastSoldPrice: number
  monthsOfOwnership: number
  yearsOfOwnership: number
  mlsListPrice: number
  mlsListDate: string
  mlsStatus: string
  mlsPhotoUrl: string
  daysOnMarket: number
  taxAssessedTotal: number
  taxAssessedYear: number
  leadTypes: string[]
  auctionDate: string
  scrapedAt: string
  phone?: string
  email?: string
}

export const MOCK_UNIFIED_LEADS: UnifiedLead[] = [
  {
    id: 'SL-001', kind: 'seller', ownerName: 'GRIFFIN SHERINE', ownershipType: 'individual',
    address: '840 Tennessee Ave', city: 'Fort Lauderdale', state: 'FL', zip: '33312', ownerOccupied: true,
    ownerMailingAddress: '840 TENNESSEE AVE', ownerMailingCity: 'FORT LAUDERDALE', ownerMailingState: 'FL', ownerMailingZip: '33312',
    units: 1, estimatedLtv: 0.260414514, estimatedPricePerSf: 241.448854108, lastSoldDate: '2010-02-16', lastSoldPrice: 109000,
    monthsOfOwnership: 273, yearsOfOwnership: 23, mlsListPrice: 0, mlsListDate: '', mlsStatus: '', mlsPhotoUrl: '', daysOnMarket: 0,
    taxAssessedTotal: 131430, taxAssessedYear: 2026, leadTypes: ['adjustable_loan', 'empty_nester', 'high_equity'], auctionDate: '', scrapedAt: '2026-08-13T13:53:04.647567+00:00', phone: '(954) 555-0198', email: 'sherine.griffin@example.com',
  },
  {
    id: 'SL-002', kind: 'seller', ownerName: 'MARTINEZ CARLOS', ownershipType: 'individual',
    address: '221 Palm Ridge Dr', city: 'Miami', state: 'FL', zip: '33135', ownerOccupied: false,
    ownerMailingAddress: '18 Coral Way', ownerMailingCity: 'MIAMI', ownerMailingState: 'FL', ownerMailingZip: '33129', units: 1,
    estimatedLtv: 0.18, estimatedPricePerSf: 318.12, lastSoldDate: '2004-09-18', lastSoldPrice: 156000, monthsOfOwnership: 263, yearsOfOwnership: 21,
    mlsListPrice: 0, mlsListDate: '', mlsStatus: '', mlsPhotoUrl: '', daysOnMarket: 0, taxAssessedTotal: 289400, taxAssessedYear: 2026,
    leadTypes: ['high_equity', 'absentee_owner'], auctionDate: '', scrapedAt: '2026-08-13T13:53:04Z', phone: '(305) 555-0134', email: 'carlos.martinez@example.com',
  },
  {
    id: 'BL-001', kind: 'buyer', ownerName: 'SUNSHORE MULTIFAMILY HOLDINGS LLC', ownershipType: 'company',
    address: '1250 Brickell Ave', city: 'Miami', state: 'FL', zip: '33131', ownerOccupied: false,
    ownerMailingAddress: '1250 BRICKELL AVE', ownerMailingCity: 'MIAMI', ownerMailingState: 'FL', ownerMailingZip: '33131', units: 42,
    estimatedLtv: 0.34, estimatedPricePerSf: 285.62, lastSoldDate: '2018-11-02', lastSoldPrice: 4200000, monthsOfOwnership: 93, yearsOfOwnership: 7,
    mlsListPrice: 0, mlsListDate: '', mlsStatus: '', mlsPhotoUrl: '', daysOnMarket: 0, taxAssessedTotal: 5100000, taxAssessedYear: 2026,
    leadTypes: ['portfolio_owner', 'expanding_operator', 'low_ltv'], auctionDate: '', scrapedAt: '2026-08-13T13:53:04Z', email: 'acquisitions@sunshoremf.com',
  },
  {
    id: 'BL-002', kind: 'buyer', ownerName: 'THE RIVERSIDE FAMILY TRUST', ownershipType: 'trust',
    address: '400 Las Olas Blvd', city: 'Fort Lauderdale', state: 'FL', zip: '33301', ownerOccupied: false,
    ownerMailingAddress: '400 LAS OLAS BLVD', ownerMailingCity: 'FORT LAUDERDALE', ownerMailingState: 'FL', ownerMailingZip: '33301', units: 18,
    estimatedLtv: 0.29, estimatedPricePerSf: 262.18, lastSoldDate: '2016-03-22', lastSoldPrice: 1750000, monthsOfOwnership: 125, yearsOfOwnership: 10,
    mlsListPrice: 0, mlsListDate: '', mlsStatus: '', mlsPhotoUrl: '', daysOnMarket: 0, taxAssessedTotal: 2200000, taxAssessedYear: 2026,
    leadTypes: ['trust_owned', 'high_equity', 'portfolio_owner'], auctionDate: '', scrapedAt: '2026-08-13T13:53:04Z', email: 'trustee@riversideholdings.com',
  },
]

// ─── Mock PSA Documents ───────────────────────────────────────────────────────

export const MOCK_PSA_DOCUMENTS: PSADocument[] = [
  {
    id: 'PSA-2026-0801',
    propertyAddress: '4821 Magnolia Creek Rd, Baton Rouge, LA 70810',
    buyerName: 'Tanya Moreau',
    sellerName: 'Dorothy & Frank Ellison',
    purchasePrice: 220000,
    earnestDeposit: 5000,
    closingDate: '2026-09-15',
    status: 'countered',
    createdAt: '2026-08-01T10:00:00Z',
    versions: [
      {
        version: 'v1.0',
        createdAt: '2026-08-01T10:00:00Z',
        createdBy: 'Marcus Reid',
        clauses: [
          { id: 'c1', title: 'Purchase Price', content: 'Buyer agrees to purchase the Property for $220,000.' },
          { id: 'c2', title: 'Earnest Money Deposit', content: 'Buyer shall deposit $5,000 within 3 business days of acceptance.' },
          { id: 'c3', title: 'Inspection Period', content: 'Buyer shall have 10 days from acceptance to conduct inspections.' },
          { id: 'c4', title: 'Closing Date', content: 'Closing shall occur on or before August 25, 2026.' },
          { id: 'c5', title: 'As-Is Clause', content: 'Property is sold in its present condition, AS-IS.' },
          { id: 'c6', title: 'Financing Contingency', content: 'This agreement is contingent upon Buyer obtaining financing within 21 days.' },
        ],
      },
      {
        version: 'v1.1',
        createdAt: '2026-08-02T14:30:00Z',
        createdBy: 'Sandra Howell',
        clauses: [
          { id: 'c1', title: 'Purchase Price', content: 'Buyer agrees to purchase the Property for $212,500.' },
          { id: 'c2', title: 'Earnest Money Deposit', content: 'Buyer shall deposit $5,000 within 3 business days of acceptance.' },
          { id: 'c3', title: 'Inspection Period', content: 'Buyer shall have 7 days from acceptance to conduct inspections.' },
          { id: 'c4', title: 'Closing Date', content: 'Closing shall occur on or before September 05, 2026.' },
          { id: 'c5', title: 'As-Is Clause', content: 'Property is sold in its present condition, AS-IS, with no seller repairs.' },
          { id: 'c7', title: 'Seller Concession', content: 'Seller agrees to contribute $2,500 toward Buyer closing costs.' },
        ],
      },
    ],
  },
  {
    id: 'PSA-2026-0803',
    propertyAddress: '209 Old Mill Trace, Prairieville, LA 70769',
    buyerName: 'Kevin Broussard',
    sellerName: 'Gerald Thibodaux',
    purchasePrice: 280000,
    earnestDeposit: 7500,
    closingDate: '2026-09-30',
    status: 'draft',
    createdAt: '2026-08-03T08:00:00Z',
    versions: [
      {
        version: 'v1.0',
        createdAt: '2026-08-03T08:00:00Z',
        createdBy: 'Marcus Reid',
        clauses: [
          { id: 'c1', title: 'Purchase Price', content: 'Buyer agrees to purchase the Property for $280,000.' },
          { id: 'c2', title: 'Earnest Money Deposit', content: 'Buyer shall deposit $7,500 within 3 business days of acceptance.' },
          { id: 'c3', title: 'Inspection Period', content: 'Buyer shall have 14 days from acceptance to conduct inspections.' },
          { id: 'c4', title: 'Closing Date', content: 'Closing shall occur on or before September 30, 2026.' },
          { id: 'c5', title: 'As-Is Clause', content: 'Property is sold in its present condition, AS-IS.' },
        ],
      },
    ],
  },
]

// ─── Mock Sent Communications ─────────────────────────────────────────────────

export const MOCK_COMM_LOG: CommMessage[] = [
  {
    id: 'MSG-001',
    channel: 'email',
    recipientName: 'Gerald Thibodaux',
    recipientEmail: 'g.thibodaux@yahoo.com',
    subject: 'Purchase & Sale Agreement - 209 Old Mill Trace',
    body: 'Dear Gerald, please find attached your PSA for review. Our team is available to answer any questions.',
    status: 'delivered',
    sentAt: '2026-08-03T08:30:00Z',
    createdAt: '2026-08-03T08:29:00Z',
  },
  {
    id: 'MSG-002',
    channel: 'sms',
    recipientName: 'Dorothy Ellison',
    recipientPhone: '(225) 555-0142',
    body: 'Hi Dorothy, this is Marcus from Premier Realty. We have a revised offer on your Magnolia Creek property. Please call us at your earliest convenience.',
    status: 'delivered',
    sentAt: '2026-08-02T15:10:00Z',
    createdAt: '2026-08-02T15:09:00Z',
  },
  {
    id: 'MSG-003',
    channel: 'omnichannel',
    recipientName: 'Kevin Broussard',
    recipientEmail: null as unknown as string,
    recipientPhone: '(225) 555-0911',
    subject: 'Your PSA is Ready for Signature',
    body: 'Kevin, your Purchase & Sale Agreement for 209 Old Mill Trace is ready. Please review and sign at the link provided.',
    status: 'queued',
    createdAt: '2026-08-03T09:00:00Z',
  },
]

// ─── Diff Computation ─────────────────────────────────────────────────────────

export function computePSADiff(vA: PSAVersion, vB: PSAVersion): DiffChange[] {
  const changes: DiffChange[] = []
  const aMap = new Map(vA.clauses.map((c) => [c.id, c]))
  const bMap = new Map(vB.clauses.map((c) => [c.id, c]))

  // Check for modifications and removals
  for (const [id, clauseA] of aMap) {
    const clauseB = bMap.get(id)
    if (!clauseB) {
      changes.push({ type: 'removed', field: clauseA.title, oldValue: clauseA.content })
    } else if (clauseA.content !== clauseB.content) {
      changes.push({ type: 'modified', field: clauseA.title, oldValue: clauseA.content, newValue: clauseB.content })
    }
  }

  // Check for additions
  for (const [id, clauseB] of bMap) {
    if (!aMap.has(id)) {
      changes.push({ type: 'added', field: clauseB.title, newValue: clauseB.content })
    }
  }

  return changes
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso))
}
