import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { BusinessHours } from '../../lib/types'
import { WEEKDAY_NAMES } from '../../lib/types'
import { Badge, Notice, Spinner } from '../components'
import { Icon } from '../../components/ui'

interface RowState {
  id: string
  weekday: number
  is_open: boolean
  start: string // "HH:MM" for the time input
  end: string
}

const toInput = (t: string) => t.slice(0, 5)
const toDb = (t: string) => (t.length === 5 ? `${t}:00` : t)

export default function BusinessHoursPage() {
  const [rows, setRows] = useState<RowState[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const { data } = await supabase.from('business_hours').select('*').order('weekday')
      if (!alive) return
      if (data) {
        const list = (data as BusinessHours[]).map((h) => ({
          id: h.id,
          weekday: h.weekday,
          is_open: h.is_open,
          start: toInput(h.start_time),
          end: toInput(h.end_time),
        }))
        // Display Monday-first for a natural weekly view.
        list.sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7))
        setRows(list)
      }
      setLoading(false)
    }
    void load()
    return () => {
      alive = false
    }
  }, [])

  const patch = (weekday: number, p: Partial<RowState>) => {
    setRows((list) => list.map((r) => (r.weekday === weekday ? { ...r, ...p } : r)))
    setDirty(true)
    setNotice(null)
  }

  const saveAll = async () => {
    setSaving(true)
    setNotice(null)
    try {
      for (const r of rows) {
        if (r.is_open && r.start >= r.end) {
          throw new Error(`${WEEKDAY_NAMES[r.weekday]}: opening time must be before closing time.`)
        }
        const { error } = await supabase
          .from('business_hours')
          .update({ is_open: r.is_open, start_time: toDb(r.start), end_time: toDb(r.end) })
          .eq('id', r.id)
        if (error) throw error
      }
      setDirty(false)
      setNotice({ kind: 'ok', text: 'Business hours saved — booking availability updates immediately.' })
    } catch (err) {
      setNotice({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Could not save business hours.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading business hours…" />

  return (
    <>
      {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

      <div className="ad-card ad-panel">
        <div className="ad-panel-head">
          <div>
            <h2>Weekly schedule</h2>
            <p>Open days and hours directly control which slots clients can book.</p>
          </div>
          <button className="ad-btn primary" onClick={() => void saveAll()} disabled={saving || !dirty}>
            <Icon name="check" /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        <div className="ad-list">
          {rows.map((r) => (
            <div className="hours-row" key={r.weekday}>
              <span className="day">{WEEKDAY_NAMES[r.weekday]}</span>
              <span>
                <Badge value={r.is_open ? 'open' : 'closed'} />
              </span>
              <input
                type="time"
                value={r.start}
                disabled={!r.is_open}
                onChange={(e) => patch(r.weekday, { start: e.target.value })}
                aria-label={`Opening time ${WEEKDAY_NAMES[r.weekday]}`}
              />
              <input
                type="time"
                value={r.end}
                disabled={!r.is_open}
                onChange={(e) => patch(r.weekday, { end: e.target.value })}
                aria-label={`Closing time ${WEEKDAY_NAMES[r.weekday]}`}
              />
              <label className="ad-check" title={r.is_open ? 'Mark closed' : 'Mark open'}>
                <input
                  type="checkbox"
                  checked={r.is_open}
                  onChange={(e) => patch(r.weekday, { is_open: e.target.checked })}
                />
                <span className="track" />
              </label>
            </div>
          ))}
        </div>

        <p className="ad-hint" style={{ marginTop: 18, marginBottom: 0 }}>
          Tip: use Blocked Dates for one-off closures like holidays — no need to touch the weekly schedule.
        </p>
      </div>
    </>
  )
}
