import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Appointment, Service } from '../../lib/types'
import { dateFromDateOnly, formatDateShort, toDateOnly } from '../../lib/booking'
import { Badge, EmptyState, Spinner, StatCard } from '../components'
import { Icon } from '../../components/ui'

function timeShort(t: string) {
  const [h, m] = t.split(':').map(Number)
  const d = new Date(2000, 0, 1, h || 0, m || 0)
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(d)
}

export default function Overview() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const [apptRes, svcRes] = await Promise.all([
        supabase.from('appointments').select('*').order('appointment_date', { ascending: true }).order('start_time', { ascending: true }),
        supabase.from('services').select('*'),
      ])
      if (!alive) return
      if (apptRes.data) setAppointments(apptRes.data as Appointment[])
      if (svcRes.data) setServices(svcRes.data as Service[])
      setLoading(false)
    }
    void load()
    return () => {
      alive = false
    }
  }, [])

  const serviceName = useMemo(() => {
    const m = new Map<string, string>()
    services.forEach((s) => m.set(s.id, s.name))
    return (id: string) => m.get(id) ?? '—'
  }, [services])

  const todayStr = toDateOnly(new Date())
  const upcoming = appointments.filter(
    (a) => a.appointment_date >= todayStr && (a.status === 'pending' || a.status === 'confirmed')
  )
  const pending = appointments.filter((a) => a.status === 'pending')
  const completed = appointments.filter((a) => a.status === 'completed')
  const activeServices = services.filter((s) => s.is_active)

  const nextUp = upcoming.slice(0, 6)
  const needsReview = [...pending]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5)

  const confirmAppt = async (id: string) => {
    const { error } = await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', id)
    if (!error) {
      setAppointments((list) => list.map((a) => (a.id === id ? { ...a, status: 'confirmed' } : a)))
    }
  }

  if (loading) return <Spinner label="Loading your dashboard…" />

  return (
    <>
      <div className="ad-stat-grid">
        <StatCard icon="calendar" tone="gold" value={upcoming.length} label="Upcoming appointments" />
        <StatCard icon="clock" tone="amber" value={pending.length} label="Pending review" />
        <StatCard icon="check" tone="green" value={completed.length} label="Completed" />
        <StatCard icon="briefcase" tone="blue" value={activeServices.length} label="Active services" />
      </div>

      <div className="ad-two-col">
        <div className="ad-card ad-panel">
          <div className="ad-panel-head">
            <div>
              <h2>Upcoming appointments</h2>
              <p>Confirmed and pending sessions on the calendar</p>
            </div>
            <a className="ad-btn ghost sm" href="#/admin/appointments">
              View all <Icon name="arrowR" />
            </a>
          </div>
          {nextUp.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="Nothing scheduled"
              text="Upcoming confirmed and pending appointments will appear here."
            />
          ) : (
            <div className="ad-list">
              {nextUp.map((a) => (
                <div className="ad-list-item" key={a.id}>
                  <span className="ad-avatar">
                    {(a.full_name.trim()[0] ?? '?').toUpperCase()}
                  </span>
                  <div className="grow">
                    <div className="t">{a.full_name}</div>
                    <div className="s">
                      {serviceName(a.service_id)} ·{' '}
                      {(() => {
                        const d = dateFromDateOnly(a.appointment_date)
                        return d ? formatDateShort(d) : a.appointment_date
                      })()}{' '}
                      at {timeShort(a.start_time)}
                    </div>
                  </div>
                  <Badge value={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ad-card ad-panel">
          <div className="ad-panel-head">
            <div>
              <h2>Needs your review</h2>
              <p>Newest appointment requests waiting for confirmation</p>
            </div>
          </div>
          {needsReview.length === 0 ? (
            <EmptyState
              icon="check"
              title="All caught up"
              text="Every appointment request has been reviewed. Nice work."
            />
          ) : (
            <div className="ad-list">
              {needsReview.map((a) => (
                <div className="ad-list-item" key={a.id}>
                  <span className="ad-avatar">
                    {(a.full_name.trim()[0] ?? '?').toUpperCase()}
                  </span>
                  <div className="grow">
                    <div className="t">{a.full_name}</div>
                    <div className="s">
                      {serviceName(a.service_id)} ·{' '}
                      {(() => {
                        const d = dateFromDateOnly(a.appointment_date)
                        return d ? formatDateShort(d) : a.appointment_date
                      })()}{' '}
                      at {timeShort(a.start_time)}
                    </div>
                  </div>
                  <button className="ad-btn primary sm" onClick={() => void confirmAppt(a.id)}>
                    <Icon name="check" /> Confirm
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
