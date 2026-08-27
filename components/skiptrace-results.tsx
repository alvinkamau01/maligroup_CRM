'use client'

import { CalendarRange, Mail, MapPin, Phone, UserRound } from 'lucide-react'

type RawRecord = Record<string, unknown>

function text(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(', ')
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}

function at(record: RawRecord, key: string, index: number): string {
  const value = record[key]
  if (Array.isArray(value)) return text(value[index])
  return index === 0 ? text(value) : ''
}

function pickRecords(result: unknown): RawRecord[] {
  if (!result) return []
  if (Array.isArray(result)) return result.flatMap(pickRecords)
  if (typeof result !== 'object') return []
  const record = result as RawRecord
  if (Array.isArray(record.records)) return record.records.flatMap(pickRecords)
  const nested = record.result ?? record.data ?? record.json
  if (nested && nested !== result) return pickRecords(nested)
  return [record]
}

function candidateCount(record: RawRecord) {
  const lengths = Object.values(record).map((value) => (Array.isArray(value) ? value.length : 1))
  return Math.max(1, ...lengths)
}

function labelledPairs(record: RawRecord, index: number, prefix: 'phone' | 'email') {
  const keys = Object.keys(record).filter((key) => new RegExp(`^${prefix}\\d+$`, 'i').test(key))
  return keys
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((key) => {
      const value = at(record, key, index)
      const typeKey = Object.keys(record).find((candidate) => candidate.toLowerCase() === `${key.toLowerCase()}_type` || candidate.toLowerCase() === `${key.toLowerCase()}-type`)
      return { value, type: typeKey ? at(record, typeKey, index) : '' }
    })
    .filter((entry) => entry.value)
}

function Row({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span className="break-words">
        <span className="text-muted-foreground">{label}: </span>
        {value}
      </span>
    </div>
  )
}

function Candidate({ record, index, total }: { record: RawRecord; index: number; total: number }) {
  const name = at(record, 'full_name', index) || [at(record, 'first_name', index), at(record, 'last_name', index)].filter(Boolean).join(' ')
  const age = at(record, 'age', index) || at(record, 'Age', index)
  const born = at(record, 'born', index)
  const livesIn = at(record, 'lives_in', index) || at(record, 'Lives in', index)
  const dateRange = at(record, 'current_address_date_range', index)
  const county = at(record, 'county_name', index)
  const address = [at(record, 'street_address', index) || at(record, 'Street Address', index), at(record, 'address_locality', index) || at(record, 'Address Locality', index), at(record, 'address_region', index) || at(record, 'Address Region', index), at(record, 'postal_code', index) || at(record, 'Postal Code', index)]
    .filter(Boolean)
    .join(', ')
  const phones = labelledPairs(record, index, 'phone')
  const emails = labelledPairs(record, index, 'email')
  const details = [
    age && { icon: UserRound, label: 'Age', value: age },
    born && { icon: CalendarRange, label: 'Born', value: born },
    livesIn && { icon: MapPin, label: 'Lives in', value: livesIn },
    county && { icon: MapPin, label: 'County', value: county },
    dateRange && { icon: CalendarRange, label: 'Resident', value: dateRange },
  ].filter(Boolean) as Array<{ icon: typeof UserRound; label: string; value: string }>

  if (!name && !details.length && !address && !phones.length && !emails.length) return null

  return (
    <article className="rounded-2xl border border-border bg-background/60 p-4">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserRound className="h-4 w-4" />
          </div>
          <h3 className="font-semibold">{name || `Possible match ${index + 1}`}</h3>
        </div>
        {total > 1 && <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{index + 1} of {total}</span>}
      </header>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {details.map((detail) => <Row key={detail.label} icon={detail.icon} label={detail.label} value={detail.value} />)}
        {address && (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm sm:col-span-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="break-words">{address}</span>
          </div>
        )}
      </div>
      {phones.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Phone numbers</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {phones.map((phone, phoneIndex) => (
              <a key={`${phone.value}-${phoneIndex}`} href={`tel:${phone.value.replace(/[^\d+]/g, '')}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm hover:border-primary/50">
                <span className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-primary" />
                  {phone.value}
                </span>
                {phone.type && <span className="text-xs text-muted-foreground">{phone.type}</span>}
              </a>
            ))}
          </div>
        </div>
      )}
      {emails.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Email addresses</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {emails.map((email, emailIndex) => (
              <a key={`${email.value}-${emailIndex}`} href={`mailto:${email.value}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm hover:border-primary/50">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span className="break-all">{email.value}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

export function SkipTraceResults({ result }: { result: unknown }) {
  const records = pickRecords(result)
  if (!records.length) return null

  const cards = records.flatMap((record) => {
    const total = candidateCount(record)
    return Array.from({ length: total }, (_, index) => ({ record, index, total }))
  })

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Skip-trace results</p>
          <h2 className="mt-1 text-lg font-semibold">{cards.length > 1 ? `${cards.length} possible matches` : 'Contact details'}</h2>
        </div>
      </div>
      <div className="mt-5 grid gap-4">
        {cards.map((card, cardIndex) => <Candidate key={`${card.index}-${cardIndex}`} record={card.record} index={card.index} total={card.total} />)}
      </div>
    </section>
  )
}
