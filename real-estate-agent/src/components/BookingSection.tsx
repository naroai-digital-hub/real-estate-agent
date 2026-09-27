import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type {
  BlockedDate,
  BookedRange,
  BusinessHours,
  BusinessSettings,
  Service,
} from '../lib/types'
import {
  formatDateLong,
  formatDateShort,
  formatDuration,
  formatPrice,
  generateSlots,
  toDateOnly,
  toTimeOnly,
  type Slot,
} from '../lib/booking'
import { serviceImageFor } from '../lib/images'
import { Icon, SmartImage } from './ui'

const STEPS = [
  { n: 1, title: 'Service', sub: 'Choose your session' },
  { n: 2, title: 'Date & Time', sub: 'Pick an open slot' },
  { n: 3, title: 'Your Details', sub: 'Tell us about you' },
  { n: 4, title: 'Confirmed', sub: 'Appointment requested' },
]

const MAX_DAYS_AHEAD = 90

interface Props {
  services: Service[]
  settings: BusinessSettings | null
  businessHours: BusinessHours[]
  blockedDates: BlockedDate[]
  preselectId: string | null
  onPreselectConsumed: () => void
}

export default function BookingSection({
  services,
  settings,
  businessHours,
  blockedDates,
  preselectId,
  onPreselectConsumed,
}: Props) {
  const [step, setStep] = useState(1)
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [date, setDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', notes: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<{
    serviceName: string
    dateLabel: string
    timeLabel: string
    duration: string
    price: string
    name: string
  } | null>(null)

  const shellRef = useRef<HTMLDivElement>(null)
  const service = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId]
  )
  const blockedSet = useMemo(
    () => new Set(blockedDates.map((b) => b.blocked_date)),
    [blockedDates]
  )
  const hoursFor = (weekday: number) => businessHours.find((h) => h.weekday === weekday)

  // Preselect a service when the user clicks "Book this service" on a card.
  useEffect(() => {
    if (preselectId && services.some((s) => s.id === preselectId)) {
      setServiceId(preselectId)
      onPreselectConsumed()
    }
  }, [preselectId, services, onPreselectConsumed])

  const scrollToShell = () =>
    shellRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const goStep = (n: number) => {
    setStep(n)
    setTimeout(scrollToShell, 60)
  }

  // ---------------- availability ----------------

  const loadSlots = async (d: Date, svc: Service) => {
    setSlotsLoading(true)
    setSlots([])
    setSlot(null)
    try {
      // Public RPC: returns only booked time ranges (no client data),
      // so the booking widget never needs appointment read access.
      const { data, error } = await supabase.rpc('booked_slots_for_date', {
        p_date: toDateOnly(d),
      })
      const booked: BookedRange[] = error || !data ? [] : (data as BookedRange[])
      const generated = generateSlots({
        date: d,
        hours: hoursFor(d.getDay()),
        durationMinutes: svc.duration_minutes,
        slotIntervalMinutes: settings?.slot_interval_minutes ?? 30,
        bookingNoticeHours: settings?.booking_notice_hours ?? 24,
        blockedDates: blockedSet,
        booked,
        now: new Date(),
      })
      setSlots(generated)
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  const pickDate = (d: Date) => {
    setDate(d)
    if (service) void loadSlots(d, service)
  }

  const pickService = (id: string) => {
    setServiceId(id)
    // If a date is already chosen, refresh slots for the new duration.
    const svc = services.find((s) => s.id === id)
    if (svc && date) void loadSlots(date, svc)
  }

  // ---------------- calendar ----------------

  const today = new Date()
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(view.y, view.m, 1))

  const canPrev =
    view.y > today.getFullYear() ||
    (view.y === today.getFullYear() && view.m > today.getMonth())
  const maxView = new Date(today.getFullYear(), today.getMonth() + 3, 1)
  const canNext =
    view.y < maxView.getFullYear() ||
    (view.y === maxView.getFullYear() && view.m < maxView.getMonth())

  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

  const isDayDisabled = (d: Date) => {
    const t = midnight(new Date())
    const dm = midnight(d)
    if (dm < t) return true
    const max = new Date(t)
    max.setDate(max.getDate() + MAX_DAYS_AHEAD)
    if (dm > max) return true
    if (blockedSet.has(toDateOnly(dm))) return true
    const h = hoursFor(dm.getDay())
    if (!h || !h.is_open) return true
    return false
  }

  const calDays = useMemo(() => {
    const first = new Date(view.y, view.m, 1)
    const startOffset = first.getDay()
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
    const cells: Array<Date | null> = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.y, view.m, d))
    return cells
  }, [view])

  // ---------------- form ----------------

  const setField = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (form.full_name.trim().length < 2) e.full_name = 'Please enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      e.email = 'Please enter a valid email address.'
    if (form.phone.replace(/\D/g, '').length < 7)
      e.phone = 'Please enter a valid phone number.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!service || !date || !slot || !validate()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      // Insert only — no .select(). The success screen is built from the
      // local form data, since public users cannot read appointments.
      const { error } = await supabase.from('appointments').insert({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        service_id: service.id,
        appointment_date: toDateOnly(date),
        start_time: toTimeOnly(slot.start),
        end_time: toTimeOnly(slot.end),
        status: 'pending',
        notes: form.notes.trim(),
      })
      if (error) throw error
      setConfirmation({
        serviceName: service.name,
        dateLabel: formatDateLong(date),
        timeLabel: `${slot.label} – ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(slot.end)}`,
        duration: formatDuration(service.duration_minutes),
        price: formatPrice(service.price),
        name: form.full_name.trim().split(' ')[0],
      })
      goStep(4)
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? `We could not submit your request: ${err.message}`
          : 'We could not submit your request. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const resetAll = () => {
    setStep(1)
    setServiceId(null)
    setDate(null)
    setSlots([])
    setSlot(null)
    setForm({ full_name: '', email: '', phone: '', notes: '' })
    setErrors({})
    setConfirmation(null)
    setSubmitError(null)
    scrollToShell()
  }

  const railRows = [
    {
      icon: 'briefcase' as const,
      k: 'Service',
      v: service ? `${service.name} · ${formatDuration(service.duration_minutes)}` : '—',
    },
    {
      icon: 'calendar' as const,
      k: 'Date',
      v: date ? formatDateLong(date) : '—',
    },
    {
      icon: 'clock' as const,
      k: 'Time',
      v: slot ? slot.label : '—',
    },
    {
      icon: 'user' as const,
      k: 'Client',
      v: form.full_name.trim() || '—',
    },
  ]

  return (
    <section className="section booking-section" id="booking">
      <div className="wrap">
        <div className="center">
          <p className="kicker" style={{ justifyContent: 'center' }}>Book an Appointment</p>
          <h2 className="h-display">Schedule your consultation</h2>
          <p className="lead">
            Reserve your one-on-one real estate appointment in four quick steps.
            You will receive a confirmation once your request is reviewed.
          </p>
        </div>

        <div className="book-shell" ref={shellRef}>
          <div className="book-steps">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className={`book-step${step === s.n ? ' active' : ''}${step > s.n ? ' done' : ''}`}
              >
                <span className="n">{step > s.n ? <Icon name="check" /> : s.n}</span>
                <div>
                  <b>{s.title}</b>
                  <span>{s.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {step < 4 ? (
            <div className="book-body">
              <div className="book-main">
                {step === 1 && (
                  <>
                    <h3>Which session would you like to book?</h3>
                    <p className="sub">Select the real estate service that fits your goals.</p>
                    <div className="pick-list">
                      {services.map((s) => (
                        <button
                          key={s.id}
                          className={`pick-card${serviceId === s.id ? ' selected' : ''}`}
                          onClick={() => pickService(s.id)}
                        >
                          <SmartImage src={serviceImageFor(s.name)} alt={s.name} />
                          <span className="pc-info">
                            <b>{s.name}</b>
                            <p>{s.description}</p>
                          </span>
                          <span className="pc-meta">
                            <span>
                              <span className="dur">{formatDuration(s.duration_minutes)}</span>
                              <span className="pr">{formatPrice(s.price)}</span>
                            </span>
                            <span className="pick-check">
                              <Icon name="check" />
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                    {services.length === 0 && (
                      <div className="slots-empty">
                        No consultation services are available right now. Please check back soon.
                      </div>
                    )}
                    <div className="book-actions">
                      <span />
                      <button
                        className="btn btn-navy"
                        disabled={!service}
                        onClick={() => goStep(2)}
                      >
                        Continue <Icon name="arrowR" />
                      </button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h3>Choose a date and time</h3>
                    <p className="sub">
                      Showing live availability for{' '}
                      <b style={{ color: 'var(--navy)' }}>{service?.name}</b> ·{' '}
                      {service ? formatDuration(service.duration_minutes) : ''}
                    </p>

                    <div className="cal">
                      <div className="cal-head">
                        <b>{monthLabel}</b>
                        <div className="cal-nav">
                          <button
                            disabled={!canPrev}
                            onClick={() =>
                              setView((v) => ({
                                y: v.m === 0 ? v.y - 1 : v.y,
                                m: v.m === 0 ? 11 : v.m - 1,
                              }))
                            }
                            aria-label="Previous month"
                          >
                            <Icon name="chevL" />
                          </button>
                          <button
                            disabled={!canNext}
                            onClick={() =>
                              setView((v) => ({
                                y: v.m === 11 ? v.y + 1 : v.y,
                                m: v.m === 11 ? 0 : v.m + 1,
                              }))
                            }
                            aria-label="Next month"
                          >
                            <Icon name="chevR" />
                          </button>
                        </div>
                      </div>
                      <div className="cal-grid">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                          <div className="cal-dow" key={d}>{d}</div>
                        ))}
                        {calDays.map((d, i) =>
                          d === null ? (
                            <span key={`e${i}`} />
                          ) : (
                            <button
                              key={d.getTime()}
                              className={`cal-day${toDateOnly(midnight(d)) === toDateOnly(midnight(new Date())) ? ' today' : ''}${date && toDateOnly(date) === toDateOnly(d) ? ' selected' : ''}`}
                              disabled={isDayDisabled(d)}
                              onClick={() => pickDate(midnight(d))}
                            >
                              {d.getDate()}
                            </button>
                          )
                        )}
                      </div>
                      <div className="cal-legend">
                        <span><i style={{ background: 'var(--gold)' }} /> Today</span>
                        <span><i style={{ background: 'var(--navy)' }} /> Selected</span>
                      </div>
                    </div>

                    {date && (
                      <>
                        <div className="slot-date-label">
                          <Icon name="clock" />
                          Available times — {formatDateShort(date)}
                        </div>
                        {slotsLoading ? (
                          <div className="slots-loading">
                            <div className="spin" />
                            Checking live availability…
                          </div>
                        ) : slots.length === 0 ? (
                          <div className="slots-empty">
                            No open slots on this date. Please try another day —
                            new times open up regularly.
                          </div>
                        ) : (
                          <>
                            <div className="slot-grid">
                              {slots.map((s) => (
                                <button
                                  key={s.start.getTime()}
                                  className={`slot${slot?.start.getTime() === s.start.getTime() ? ' selected' : ''}`}
                                  onClick={() => setSlot(s)}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                            <p className="slot-hint">
                              All times are local. Your session lasts{' '}
                              {service ? formatDuration(service.duration_minutes) : ''}.
                            </p>
                          </>
                        )}
                      </>
                    )}

                    <div className="book-actions">
                      <button className="btn btn-outline" onClick={() => goStep(1)}>
                        Back
                      </button>
                      <button
                        className="btn btn-navy"
                        disabled={!slot}
                        onClick={() => goStep(3)}
                      >
                        Continue <Icon name="arrowR" />
                      </button>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h3>Your details</h3>
                    <p className="sub">
                      We use this only to confirm your appointment and reach you if plans change.
                    </p>
                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="bk-name">Full name</label>
                        <input
                          id="bk-name"
                          value={form.full_name}
                          onChange={(e) => setField('full_name', e.target.value)}
                          placeholder="Jordan Ellis"
                          className={errors.full_name ? 'invalid' : ''}
                          autoComplete="name"
                        />
                        {errors.full_name && <span className="err">{errors.full_name}</span>}
                      </div>
                      <div className="field">
                        <label htmlFor="bk-phone">Phone</label>
                        <input
                          id="bk-phone"
                          value={form.phone}
                          onChange={(e) => setField('phone', e.target.value)}
                          placeholder="+1 (555) 000-1234"
                          className={errors.phone ? 'invalid' : ''}
                          autoComplete="tel"
                          inputMode="tel"
                        />
                        {errors.phone && <span className="err">{errors.phone}</span>}
                      </div>
                      <div className="field full">
                        <label htmlFor="bk-email">Email</label>
                        <input
                          id="bk-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setField('email', e.target.value)}
                          placeholder="you@example.com"
                          className={errors.email ? 'invalid' : ''}
                          autoComplete="email"
                        />
                        {errors.email && <span className="err">{errors.email}</span>}
                      </div>
                      <div className="field full">
                        <label htmlFor="bk-notes">
                          Notes <small>(optional)</small>
                        </label>
                        <textarea
                          id="bk-notes"
                          value={form.notes}
                          onChange={(e) => setField('notes', e.target.value)}
                          placeholder="Anything we should prepare — a property address, your timeline, questions for the agent…"
                        />
                      </div>
                    </div>

                    {submitError && (
                      <div
                        className="ad-notice err"
                        style={{ marginTop: 22, marginBottom: 0 }}
                        role="alert"
                      >
                        <Icon name="alert" /> {submitError}
                      </div>
                    )}

                    <div className="book-actions">
                      <button className="btn btn-outline" onClick={() => goStep(2)}>
                        Back
                      </button>
                      <button
                        className="btn btn-gold"
                        disabled={submitting}
                        onClick={submit}
                      >
                        {submitting ? 'Submitting…' : (
                          <>
                            <Icon name="check" /> Request Appointment
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <aside className="book-rail">
                <h4>Appointment summary</h4>
                <p className="rail-sub">Your selection updates live as you book.</p>
                {!service && !date ? (
                  <div className="rail-empty">
                    Nothing selected yet — your summary will appear here.
                  </div>
                ) : (
                  <>
                    <div className="rail-rows">
                      {railRows.map((r) => (
                        <div className="rail-row" key={r.k}>
                          <Icon name={r.icon} />
                          <div>
                            <span className="k">{r.k}</span>
                            <span className="v">{r.v}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rail-total">
                      <span>Total due at booking</span>
                      <b>{service ? formatPrice(service.price) : '—'}</b>
                    </div>
                  </>
                )}
                <p className="rail-note">
                  Submitting sends an appointment request. Your agent reviews it
                  and confirms your time by email or phone.
                </p>
              </aside>
            </div>
          ) : (
            <div className="success-wrap">
              <div className="success-seal">
                <Icon name="check" />
              </div>
              <h3>Request received{confirmation ? `, ${confirmation.name}` : ''}!</h3>
              <p>
                Your appointment request has been sent. Your agent will review it
                and confirm your time shortly — keep an eye on your inbox.
              </p>
              {confirmation && (
                <div className="success-card">
                  <div className="rail-row">
                    <Icon name="briefcase" />
                    <div>
                      <span className="k">Service</span>
                      <span className="v">{confirmation.serviceName} · {confirmation.duration}</span>
                    </div>
                  </div>
                  <div className="rail-row">
                    <Icon name="calendar" />
                    <div>
                      <span className="k">Date</span>
                      <span className="v">{confirmation.dateLabel}</span>
                    </div>
                  </div>
                  <div className="rail-row">
                    <Icon name="clock" />
                    <div>
                      <span className="k">Time</span>
                      <span className="v">{confirmation.timeLabel}</span>
                    </div>
                  </div>
                  <div className="rail-row">
                    <Icon name="tag" />
                    <div>
                      <span className="k">Price</span>
                      <span className="v">{confirmation.price}</span>
                    </div>
                  </div>
                </div>
              )}
              <button className="btn btn-navy" onClick={resetAll}>
                <Icon name="plus" /> Book another appointment
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
