import { Fragment, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Appointment, AppointmentStatus, Service } from '../../lib/types'
import { APPOINTMENT_STATUSES } from '../../lib/types'
import { dateFromDateOnly, formatDateShort } from '../../lib/booking'
import { Badge, EmptyState, Notice, Spinner } from '../components'
import { Icon } from '../../components/ui'

function timeShort(t: string) {
  const [h, m] = t.split(':').map(Number)
  const d = new Date(2000, 0, 1, h || 0, m || 0)
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(d)
}

type Filter = 'all' | AppointmentStatus

export default function AppointmentsPage({ onChanged }: { onChanged: () => void }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const [apptRes, svcRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .order('appointment_date', { ascending: false })
          .order('start_time', { ascending: false }),
        supabase.from('services').select('id,name'),
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
    return (id: string) => m.get(id) ?? 'Unknown service'
  }, [services])

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: appointments.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0 }
    appointments.forEach((a) => {
      c[a.status] = (c[a.status] ?? 0) + 1
    })
    return c
  }, [appointments])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return appointments.filter((a) => {
      if (filter !== 'all' && a.status !== filter) return false
      if (!q) return true
      return (
        a.full_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q) ||
        serviceName(a.service_id).toLowerCase().includes(q)
      )
    })
  }, [appointments, filter, query, serviceName])

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    setNotice(null)
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
    if (error) {
      setNotice({ kind: 'err', text: `Could not update status: ${error.message}` })
      return
    }
    setAppointments((list) => list.map((a) => (a.id === id ? { ...a, status } : a)))
    onChanged()
  }

  if (loading) return <Spinner label="Loading appointments…" />

  const filters: Array<{ key: Filter; label: string }> = [
    { key: 'all', label: 'All' },
    ...APPOINTMENT_STATUSES.map((s) => ({
      key: s as Filter,
      label: s[0].toUpperCase() + s.slice(1),
    })),
  ]

  return (
    <>
      {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

      <div className="ad-card ad-panel">
        <div className="ad-panel-head" style={{ flexWrap: 'wrap' }}>
          <div className="ad-filters">
            {filters.map((f) => (
              <button
                key={f.key}
                className={`ad-chip${filter === f.key ? ' active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                <span className="n">{counts[f.key]}</span>
              </button>
            ))}
          </div>
          <div className="ad-field" style={{ margin: 0, minWidth: 240 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone…"
              aria-label="Search appointments"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon="calendar"
            title={query || filter !== 'all' ? 'No matches' : 'No appointments yet'}
            text={
              query || filter !== 'all'
                ? 'Try a different search or status filter.'
                : 'When clients book through your website, their requests will land here.'
            }
          />
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Date &amp; time</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((a) => (
                  <Fragment key={a.id}>
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span className="ad-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>
                            {(a.full_name.trim()[0] ?? '?').toUpperCase()}
                          </span>
                          <div>
                            <div className="strong">{a.full_name}</div>
                            <div className="sub">{a.email}</div>
                            <div className="sub">{a.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td>{serviceName(a.service_id)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="strong">
                          {(() => {
                            const d = dateFromDateOnly(a.appointment_date)
                            return d ? formatDateShort(d) : a.appointment_date
                          })()}
                        </div>
                        <div className="sub">
                          {timeShort(a.start_time)} – {timeShort(a.end_time)}
                        </div>
                      </td>
                      <td>
                        <Badge value={a.status} />
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <select
                          className="status-select"
                          value={a.status}
                          onChange={(e) => void updateStatus(a.id, e.target.value as AppointmentStatus)}
                          aria-label={`Change status for ${a.full_name}`}
                        >
                          {APPOINTMENT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s[0].toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>{' '}
                        <button
                          className="ad-icon-btn"
                          title={expanded === a.id ? 'Hide details' : 'View details'}
                          onClick={() => setExpanded((x) => (x === a.id ? null : a.id))}
                        >
                          <Icon name="eye" />
                        </button>
                      </td>
                    </tr>
                    {expanded === a.id && (
                      <tr key={`${a.id}-notes`}>
                        <td colSpan={5} style={{ background: '#fbfaf7' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ad-muted)', marginBottom: 8 }}>
                            Client notes
                          </div>
                          <div className="appt-notes" style={{ marginTop: 0 }}>
                            {a.notes?.trim() ? a.notes : 'No notes left by the client.'}
                          </div>
                          <div className="sub" style={{ marginTop: 10 }}>
                            Requested{' '}
                            {new Intl.DateTimeFormat('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            }).format(new Date(a.created_at))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
