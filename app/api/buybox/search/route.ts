import { NextRequest, NextResponse } from 'next/server'

const APIFY_API_URL = 'https://api.apify.com/v2/actors/crawlerbros~propwire-leads-scraper/run-sync-get-dataset-items'
const APIFY_TOKEN = process.env.APIFY_API_TOKEN

export async function POST(request: NextRequest) {
  try {
    if (!APIFY_TOKEN) {
      return NextResponse.json(
        { error: 'Apify API token not configured' },
        { status: 500 }
      )
    }
    
    const body = await request.json()
    
    const { locations, leadTypes, maxItems } = body
    
    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { error: 'Locations array is required' },
        { status: 400 }
      )
    }

    const payload = {
      locations,
      leadTypes: leadTypes || [],
      maxItems: maxItems || 50
    }

    const response = await fetch(`${APIFY_API_URL}?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Apify API error:', errorText)
      return NextResponse.json(
        { error: `Search failed: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json(data)

  } catch (error) {
    console.error('Buy Box search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}