import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { BusinessSettings } from '../../lib/types'
import { Notice, Spinner } from '../components'
import { Icon } from '../../components/ui'

export default function SettingsPage() {
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [form, setForm] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    slot_interval_minutes: '30',
    booking_notice_hours: '24',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const { data } = await supabase.from('business_settings').select('*').limit(1).maybeSingle()
      if (!alive) return
      if (data) {
        const s = data as BusinessSettings
        setSettingsId(s.id)
        setForm({
          business_name: s.business_name ?? '',
          business_email: s.business_email ?? '',
          business_phone: s.business_phone ?? '',
          business_address: s.business_address ?? '',
          slot_interval_minutes: String(s.slot_interval_minutes ?? 30),
          booking_notice_hours: String(s.booking_notice_hours ?? 24),
        })
      }
      setLoading(false)
    }
    void load()
    return () => {
      alive = false
    }
  }, [])

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setNotice(null)
  }

  const save = async () => {
    setNotice(null)
    const slotInterval = parseInt(form.slot_interval_minutes, 10)
    const noticeHours = parseInt(form.booking_notice_hours, 10)
    if (!form.business_name.trim()) {
      setNotice({ kind: 'err', text: 'Business name is required.' })
      return
    }
    if (!Number.isFinite(slotInterval) || slotInterval < 5 || slotInterval > 240) {
      setNotice({ kind: 'err', text: 'Slot interval must be between 5 and 240 minutes.' })
      return
    }
    if (!Number.isFinite(noticeHours) || noticeHours < 0 || noticeHours > 720) {
      setNotice({ kind: 'err', text: 'Booking notice must be between 0 and 720 hours.' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        business_name: form.business_name.trim(),
        business_email: form.business_email.trim(),
        business_phone: form.business_phone.trim(),
        business_address: form.business_address.trim(),
        slot_interval_minutes: slotInterval,
        booking_notice_hours: noticeHours,
      }
      if (settingsId) {
        const { error } = await supabase.from('business_settings').update(payload).eq('id', settingsId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('business_settings').insert(payload).select('id').single()
        if (error) throw error
        setSettingsId((data as { id: string }).id)
      }
      setNotice({ kind: 'ok', text: 'Business settings saved — the website and booking flow update immediately.' })
    } catch (err) {
      setNotice({ kind: 'err', text: err instanceof Error ? err.message : 'Could not save settings.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading business settings…" />

  return (
    <>
      {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

      <div className="ad-card ad-panel">
        <div className="ad-panel-head">
          <div>
            <h2>Business profile</h2>
            <p>This information appears across the public website.</p>
          </div>
        </div>

        <div className="ad-grid-2">
          <div className="ad-field">
            <label htmlFor="set-name">Business Name</label>
            <input id="set-name" value={form.business_name} onChange={(e) => set('business_name', e.target.value)} placeholder="Muse Property Group" />
          </div>
          <div className="ad-field">
            <label htmlFor="set-email">Business Email</label>
            <input id="set-email" type="email" value={form.business_email} onChange={(e) => set('business_email', e.target.value)} placeholder="hello@agency.com" />
          </div>
          <div className="ad-field">
            <label htmlFor="set-phone">Business Phone</label>
            <input id="set-phone" value={form.business_phone} onChange={(e) => set('business_phone', e.target.value)} placeholder="+1 (555) 014-8890" />
          </div>
          <div className="ad-field">
            <label htmlFor="set-address">Business Address</label>
            <input id="set-address" value={form.business_address} onChange={(e) => set('business_address', e.target.value)} placeholder="123 Market Street, Suite 400" />
          </div>
        </div>
      </div>

      <div className="ad-card ad-panel">
        <div className="ad-panel-head">
          <div>
            <h2>Booking rules</h2>
            <p>These rules shape every time slot clients see.</p>
          </div>
        </div>

        <div className="ad-grid-2">
          <div>
            <div className="ad-field">
              <label htmlFor="set-interval">Slot Interval <small>(minutes)</small></label>
              <input
                id="set-interval"
                type="number"
                min={5}
                max={240}
                step={5}
                value={form.slot_interval_minutes}
                onChange={(e) => set('slot_interval_minutes', e.target.value)}
              />
            </div>
            <p className="ad-hint">How often a new slot starts — e.g. 30 means 9:00, 9:30, 10:00…</p>
          </div>
          <div>
            <div className="ad-field">
              <label htmlFor="set-notice">Booking Notice <small>(hours)</small></label>
              <input
                id="set-notice"
                type="number"
                min={0}
                max={720}
                step={1}
                value={form.booking_notice_hours}
                onChange={(e) => set('booking_notice_hours', e.target.value)}
              />
            </div>
            <p className="ad-hint">Minimum lead time — e.g. 24 hides any slot starting within the next 24 hours.</p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="ad-btn primary" onClick={() => void save()} disabled={saving}>
            <Icon name="check" /> {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>
    </>
  )
}
