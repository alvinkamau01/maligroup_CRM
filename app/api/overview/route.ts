import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerClient()
    
    // Fetch all property leads
    const { data: leadsData, error: leadsError } = await supabase
      .from('property_leads')
      .select('*')
      .order('id', { ascending: false })
      .limit(100)

    if (leadsError) throw leadsError

    const allLeads = leadsData || []
    const sellerLeads = allLeads.filter((l: any) => l.units <= 2)
    const buyerLeads = allLeads.filter((l: any) => l.units > 2)
    const sellerVerified = sellerLeads.filter((l: any) => l.owner_name && l.owner_name !== 'Unknown owner').length

    // PSA documents - using property_leads as proxy since no PSA table exists yet
    const totalAgreements = allLeads.length
    const activeAgreements = totalAgreements

    // Communications - using property_leads as proxy since no comm table exists yet
    const totalMessages = allLeads.length
    const queuedMessages = allLeads.filter((l: any) => l.owner_name).length

    // Recent property leads (top 4)
    const recentPropertyLeads = allLeads.slice(0, 4).map((l: any) => ({
      id: l.id,
      address: [l.address, l.city, l.state, l.zip].filter(Boolean).join(', '),
      owner: l.owner_name || 'Unknown',
      city: l.city,
      marketValue: l.estimated_value || 0,
      skipTraceStatus: l.owner_name && l.owner_name !== 'Unknown owner' ? 'verified' : 'pending',
    }))

    // Recent agreements
    const recentAgreements = allLeads.slice(0, 5).map((l: any) => ({
      id: l.id,
      status: 'draft' as const,
      buyerName: 'Mali Group',
      sellerName: l.property_type || 'Unknown',
      purchasePrice: l.estimated_value || 0,
      versions: 1,
    }))

    // Recent communications
    const recentCommunications = allLeads.slice(0, 5).map((l: any) => ({
      id: l.id,
      recipientName: l.owner_name || 'Unknown',
      channel: 'email' as const,
      subject: 'Property inquiry',
      status: 'sent' as const,
      createdAt: l.created_at || new Date().toISOString(),
    }))

    return NextResponse.json({
      stats: {
        sellerLeads: sellerLeads.length,
        sellerVerified,
        buyerLeads: buyerLeads.length,
        activeAgreements,
        totalAgreements,
        queuedMessages,
        totalMessages,
        recentPropertyLeads,
        recentAgreements,
        recentCommunications,
      },
    })
  } catch (error) {
    console.error('Overview fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch overview data' }, { status: 500 })
  }
}
