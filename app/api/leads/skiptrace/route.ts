import { NextRequest, NextResponse } from 'next/server'

const APIFY_API_URL = 'https://api.apify.com/v2/actors/one-api~skip-trace/run-sync-get-dataset-items'
const APIFY_TOKEN = process.env.APIFY_API_TOKEN

interface SkipTraceRequest {
  address: string
  city: string
  state: string
  zip: string
  ownerName?: string
}

interface SkipTraceResult {
  success: boolean
  phone?: string
  email?: string
  fullName?: string
  rawData?: any
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    if (!APIFY_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Apify API token not configured' },
        { status: 500 }
      )
    }
    
    const body: SkipTraceRequest = await request.json()
    
    const { address, city, state, zip, ownerName } = body
    
    if (!address || !city || !state || !zip) {
      return NextResponse.json(
        { success: false, error: 'Missing required address fields' },
        { status: 400 }
      )
    }

    const streetCityStateZip = `${address},${city},${state},${zip}`
    
    const payload = {
      max_results: 1,
      street_citystatezip: [streetCityStateZip]
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
        { success: false, error: `API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No results found for this address' },
        { status: 404 }
      )
    }

    const result = data[0]
    
    // Extract phone numbers
    const phones = []
    for (let i = 1; i <= 5; i++) {
      const phone = result[`phone${i}`]
      const phoneType = result[`phone${i}_type`]
      if (phone) {
        phones.push({ number: phone, type: phoneType })
      }
    }
    
    // Extract emails
    const emails = []
    for (let i = 1; i <= 5; i++) {
      const email = result[`email${i}`]
      if (email) {
        emails.push(email)
      }
    }
    
    const fullName = result.full_name || ownerName
    
    const bestPhone = phones[0]?.number || ''
    const bestEmail = emails[0] || ''

    return NextResponse.json({
      success: true,
      phone: bestPhone,
      email: bestEmail,
      fullName,
      phones,
      emails,
      rawData: result
    } as SkipTraceResult)

  } catch (error) {
    console.error('Skip trace error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}