export interface OverviewStats {
  sellerLeads: number
  sellerVerified: number
  buyerLeads: number
  activeAgreements: number
  totalAgreements: number
  queuedMessages: number
  totalMessages: number
  recentPropertyLeads: Array<{
    id: string
    address: string
    owner: string
    city: string
    marketValue: number
    skipTraceStatus: string
  }>
  recentAgreements: Array<{
    id: string
    status: string
    buyerName: string
    sellerName: string
    purchasePrice: number
    versions: number
  }>
  recentCommunications: Array<{
    id: string
    recipientName: string
    channel: string
    subject?: string
    status: string
    createdAt: string
  }>
}
