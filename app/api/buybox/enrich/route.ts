import { NextResponse } from 'next/server'

const APIFY_TOKEN = process.env.APIFY_TOKEN
const APIFY_DATASET_ID = 'djXHqO2emTXRfQXoH'

export async function POST(request: Request) {
  if (!APIFY_TOKEN) return NextResponse.json({ error: 'Zillow enrichment is not configured. Set APIFY_TOKEN.' }, { status: 500 })

  let body: { addresses: string[]; includeClimateRisk?: boolean; includeComparableHomes?: boolean; includeZestimateHistory?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { addresses, includeClimateRisk, includeComparableHomes, includeZestimateHistory } = body

  if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
    return NextResponse.json({ error: 'At least one address is required' }, { status: 400 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90000)
  let response: Response
  try {
    response = await fetch(`https://api.apify.com/v2/actors/sian.agency~zillow-property-detail-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        addresses,
        includeClimateRisk: includeClimateRisk ?? true,
        includeComparableHomes: includeComparableHomes ?? true,
        includeZestimateHistory: includeZestimateHistory ?? true,
      }),
      signal: controller.signal,
    })
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Zillow enrichment timed out. Try a narrower search.' }, { status: 504 })
    }
    return NextResponse.json({ error: 'Unable to reach the Zillow enrichment service' }, { status: 502 })
  }
  clearTimeout(timeout)

  const responseText = await response.text()
  let payload: unknown = null
  try {
    payload = responseText ? JSON.parse(responseText) : null
  } catch {
    payload = responseText ? { raw: responseText } : null
  }
  if (!response.ok) return NextResponse.json({ error: 'Zillow enrichment service failed', detail: payload }, { status: 502 })

  let results: unknown[] = []
  if (Array.isArray(payload)) {
    results = payload
  } else if (typeof payload === 'object' && payload !== null) {
    const p = payload as Record<string, unknown>
    results = Array.isArray(p.results)
      ? p.results as unknown[]
      : Array.isArray(p.data)
        ? p.data as unknown[]
        : []
  }

  return NextResponse.json({ ok: true, count: results.length, results })
}