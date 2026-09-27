import type { BookedRange, BusinessHours } from './types'

// ---------------------------------------------------------------------
// Availability engine.
// All slots are normalized as { start: Date, end: Date, label: string }.
// Only real Date objects are formatted — never raw strings.
// ---------------------------------------------------------------------

export interface Slot {
  start: Date
  end: Date
  label: string
}

/** Parse "HH:MM" or "HH:MM:SS" safely. Returns null on invalid input. */
export function parseTime(value: string | null | undefined): { h: number; m: number } | null {
  if (!value) return null
  const parts = value.split(':').map((p) => Number(p))
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return null
  const [h, m] = parts
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return { h, m }
}

/** Combine a calendar date with a "HH:MM[:SS]" time into a real local Date. */
export function combineDateTime(date: Date, time: string): Date | null {
  const t = parseTime(time)
  if (!t) return null
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), t.h, t.m, 0, 0)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "YYYY-MM-DD" for Supabase date columns. */
export function toDateOnly(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** "HH:MM:SS" for Supabase time columns. */
export function toTimeOnly(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}:00`
}

const timeLabelFmt = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
})

export function formatTimeLabel(d: Date): string {
  return timeLabelFmt.format(d)
}

const dateLongFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

export function formatDateLong(d: Date): string {
  return dateLongFmt.format(d)
}

const dateShortFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

export function formatDateShort(d: Date): string {
  return dateShortFmt.format(d)
}

export function formatPrice(price: number): string {
  if (!price || price <= 0) return 'Complimentary'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`
}

interface GenerateSlotsOptions {
  date: Date
  hours: BusinessHours | undefined
  durationMinutes: number
  slotIntervalMinutes: number
  bookingNoticeHours: number
  blockedDates: Set<string> // "YYYY-MM-DD"
  booked: BookedRange[]
  now?: Date
}

/**
 * Generate available slots for a date.
 * Rules: inside working hours · skip blocked dates · skip overlaps
 * (new_start < existing_end && new_end > existing_start) ·
 * respect booking notice · fit the full service duration.
 */
export function generateSlots(opts: GenerateSlotsOptions): Slot[] {
  const {
    date,
    hours,
    durationMinutes,
    slotIntervalMinutes,
    bookingNoticeHours,
    blockedDates,
    booked,
    now = new Date(),
  } = opts

  if (!hours || !hours.is_open) return []
  if (blockedDates.has(toDateOnly(date))) return []

  const open = combineDateTime(date, hours.start_time)
  const close = combineDateTime(date, hours.end_time)
  if (!open || !close || open >= close) return []

  const intervalMs = Math.max(5, slotIntervalMinutes) * 60_000
  const durationMs = Math.max(5, durationMinutes) * 60_000
  const earliest = new Date(now.getTime() + Math.max(0, bookingNoticeHours) * 3_600_000)

  const bookedRanges: Array<{ s: number; e: number }> = []
  for (const b of booked) {
    const s = combineDateTime(date, b.start_time)
    const e = combineDateTime(date, b.end_time)
    if (s && e && s < e) bookedRanges.push({ s: s.getTime(), e: e.getTime() })
  }

  const slots: Slot[] = []
  for (let t = open.getTime(); t + durationMs <= close.getTime(); t += intervalMs) {
    const start = new Date(t)
    const end = new Date(t + durationMs)
    if (start < earliest) continue
    const overlaps = bookedRanges.some((b) => start.getTime() < b.e && end.getTime() > b.s)
    if (overlaps) continue
    slots.push({ start, end, label: formatTimeLabel(start) })
  }
  return slots
}

/** Build a Date at local midnight for a "YYYY-MM-DD" string. */
export function dateFromDateOnly(value: string): Date | null {
  const parts = value.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null
  const [y, m, d] = parts
  const dt = new Date(y, m - 1, d)
  return Number.isNaN(dt.getTime()) ? null : dt
}
