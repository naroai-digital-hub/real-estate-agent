import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { BlockedDate } from '../../lib/types'
import { dateFromDateOnly, formatDateLong, toDateOnly } from '../../lib/booking'
import { EmptyState, Notice, Spinner } from '../components'
import { Icon } from '../../components/ui'

export default function BlockedDatesPage() {
  const [dates, setDates] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [newDate, setNewDate] = useState('')
  const [reason, setReason] = useState('')
  const [adding, setAdding] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = async () => {
    const { data } = await supabase
      .from('blocked_dates')
      .select('*')
      .order('blocked_date', { ascending: false })
    if (data) setDates(data as BlockedDate[])
  }

  useEffect(() => {
    let alive = true
    void (async () => {
      await load()
      if (alive) setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [])

  const add = async () => {
    setNotice(null)
    if (!newDate) {
      setNotice({ kind: 'err', text: 'Please choose a date to block.' })
      return
    }
    if (newDate < toDateOnly(new Date())) {
      setNotice({ kind: 'err', text: 'You cannot block a date in the past.' })
      return
    }
    setAdding(true)
    try {
      const { error } = await supabase.from('blocked_dates').insert({
        blocked_date: newDate,
        reason: reason.trim(),
      })
      if (error) throw error
      setNewDate('')
      setReason('')
      await load()
      setNotice({ kind: 'ok', text: 'Date blocked — clients can no longer book it.' })
    } catch (err) {
      setNotice({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Could not block the date.',
      })
    } finally {
      setAdding(false)
    }
  }

  const remove = async (id: string) => {
    if (confirming !== id) {
      setConfirming(id)
      return
    }
    setConfirming(null)
    const { error } = await supabase.from('blocked_dates').delete().eq('id', id)
    if (error) {
      setNotice({ kind: 'err', text: `Could not remove: ${error.message}` })
      return
    }
    setDates((list) => list.filter((d) => d.id !== id))
    setNotice({ kind: 'ok', text: 'Blocked date removed — the day is bookable again.' })
  }

  if (loading) return <Spinner label="Loading blocked dates…" />

  return (
    <>
      {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

      <div className="ad-card ad-panel">
        <div className="ad-panel-head">
          <div>
            <h2>Block a date</h2>
            <p>Holidays, days off, or any date you do not want bookings.</p>
          </div>
        </div>
        <div className="ad-grid-3" style={{ alignItems: 'end' }}>
          <div className="ad-field" style={{ marginBottom: 0 }}>
            <label htmlFor="blk-date">Date</label>
            <input
              id="blk-date"
              type="date"
              value={newDate}
              min={toDateOnly(new Date())}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div className="ad-field" style={{ marginBottom: 0 }}>
            <label htmlFor="blk-reason">Reason <small>(optional)</small></label>
            <input
              id="blk-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Public holiday"
            />
          </div>
          <div>
            <button className="ad-btn dark" onClick={() => void add()} disabled={adding} style={{ width: '100%' }}>
              <Icon name="ban" /> {adding ? 'Blocking…' : 'Block date'}
            </button>
          </div>
        </div>
      </div>

      <div className="ad-card ad-panel">
        <div className="ad-panel-head">
          <div>
            <h2>{dates.length} blocked date{dates.length === 1 ? '' : 's'}</h2>
            <p>Past dates stay in history but no longer affect booking.</p>
          </div>
        </div>

        {dates.length === 0 ? (
          <EmptyState
            icon="ban"
            title="No blocked dates"
            text="Block holidays or days off and they will disappear from the booking calendar automatically."
          />
        ) : (
          <div className="ad-list">
            {dates.map((d) => {
              const dt = dateFromDateOnly(d.blocked_date)
              const isPast = d.blocked_date < toDateOnly(new Date())
              return (
                <div className="ad-list-item" key={d.id} style={isPast ? { opacity: 0.6 } : undefined}>
                  <span className="ad-avatar" style={{ background: 'var(--ad-danger-soft)', color: 'var(--ad-danger)' }}>
                    <Icon name="ban" />
                  </span>
                  <div className="grow">
                    <div className="t">{dt ? formatDateLong(dt) : d.blocked_date}</div>
                    <div className="s">{d.reason?.trim() ? d.reason : 'No reason given'}{isPast ? ' · past' : ''}</div>
                  </div>
                  <button
                    className={`ad-btn sm ${confirming === d.id ? 'danger-ghost' : 'ghost'}`}
                    onClick={() => void remove(d.id)}
                    onBlur={() => setConfirming(null)}
                  >
                    {confirming === d.id ? 'Click again to confirm' : 'Remove'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
