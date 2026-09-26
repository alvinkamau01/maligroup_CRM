import { NextRequest, NextResponse } from 'next/server'

const WEBHOOK_URL = process.env.N8N_BUYBOX_WEBHOOK_URL

export async function POST(request: NextRequest) {
  try {
    if (!WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'Skip trace webhook URL not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    
    const { ownerName, address, city, state, zip } = body

    if (!address || !city || !state || !zip) {
      return NextResponse.json(
        { error: 'Missing required address fields' },
        { status: 400 }
      )
    }

    const cityStateZip = [city, state, zip].filter(Boolean).join(', ')
    
    const payload = {
      max_results: 1,
      name: [`${ownerName};${cityStateZip}`],
      street_citystatezip: [address, cityStateZip]
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Skip trace workflow could not be reached.' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Skip trace webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}