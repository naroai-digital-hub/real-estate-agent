import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Service } from '../../lib/types'
import { formatDuration, formatPrice } from '../../lib/booking'
import { Badge, EmptyState, Modal, Notice, Spinner } from '../components'
import { Icon } from '../../components/ui'

interface FormState {
  name: string
  description: string
  duration_minutes: string
  price: string
  is_active: boolean
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  duration_minutes: '60',
  price: '0',
  is_active: true,
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<null | { mode: 'add' } | { mode: 'edit'; service: Service }>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setServices(data as Service[])
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

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setModal({ mode: 'add' })
  }

  const openEdit = (service: Service) => {
    setForm({
      name: service.name,
      description: service.description ?? '',
      duration_minutes: String(service.duration_minutes),
      price: String(service.price),
      is_active: service.is_active,
    })
    setFormError(null)
    setModal({ mode: 'edit', service })
  }

  const save = async () => {
    setFormError(null)
    const duration = parseInt(form.duration_minutes, 10)
    const price = parseFloat(form.price)
    if (!form.name.trim()) {
      setFormError('Please give the service a name.')
      return
    }
    if (!Number.isFinite(duration) || duration < 5 || duration > 480) {
      setFormError('Duration must be between 5 and 480 minutes.')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setFormError('Price must be zero or more.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        duration_minutes: duration,
        price,
        is_active: form.is_active,
      }
      if (modal?.mode === 'edit') {
        const { error } = await supabase.from('services').update(payload).eq('id', modal.service.id)
        if (error) throw error
        setNotice({ kind: 'ok', text: `“${payload.name}” was updated.` })
      } else {
        const { error } = await supabase.from('services').insert(payload)
        if (error) throw error
        setNotice({ kind: 'ok', text: `“${payload.name}” was added and is now bookable.` })
      }
      setModal(null)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save the service.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (service: Service) => {
    setNotice(null)
    const { error } = await supabase
      .from('services')
      .update({ is_active: !service.is_active })
      .eq('id', service.id)
    if (error) {
      setNotice({ kind: 'err', text: `Could not update: ${error.message}` })
      return
    }
    setServices((list) =>
      list.map((s) => (s.id === service.id ? { ...s, is_active: !s.is_active } : s))
    )
    setNotice({
      kind: 'ok',
      text: service.is_active
        ? `“${service.name}” deactivated — it no longer appears on the booking page.`
        : `“${service.name}” activated — clients can book it now.`,
    })
  }

  if (loading) return <Spinner label="Loading services…" />

  return (
    <>
      {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

      <div className="ad-card ad-panel">
        <div className="ad-panel-head">
          <div>
            <h2>{services.length} service{services.length === 1 ? '' : 's'}</h2>
            <p>Inactive services stay here but are hidden from the public booking page.</p>
          </div>
          <button className="ad-btn primary" onClick={openAdd}>
            <Icon name="plus" /> Add service
          </button>
        </div>

        {services.length === 0 ? (
          <EmptyState
            icon="briefcase"
            title="No services yet"
            text="Add your first consultation service so clients can start booking."
            action={
              <button className="ad-btn primary" onClick={openAdd}>
                <Icon name="plus" /> Add service
              </button>
            }
          />
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="strong">{s.name}</div>
                      <div className="sub" style={{ maxWidth: 420 }}>{s.description}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDuration(s.duration_minutes)}</td>
                    <td style={{ whiteSpace: 'nowrap' }} className="strong">{formatPrice(s.price)}</td>
                    <td>
                      <Badge value={s.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="ad-icon-btn" title={`Edit ${s.name}`} onClick={() => openEdit(s)}>
                        <Icon name="pencil" />
                      </button>{' '}
                      <button
                        className={`ad-btn sm ${s.is_active ? 'ghost' : 'primary'}`}
                        onClick={() => void toggleActive(s)}
                        title={s.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {s.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal.mode === 'add' ? 'Add a service' : `Edit “${modal.service.name}”`}
          sub={
            modal.mode === 'add'
              ? 'New active services appear on the booking page immediately.'
              : 'Changes apply to the booking page right away.'
          }
          onClose={() => setModal(null)}
        >
          {formError && <Notice kind="err">{formError}</Notice>}

          <div className="ad-field">
            <label htmlFor="svc-name">Service name</label>
            <input
              id="svc-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Buyer Consultation"
            />
          </div>

          <div className="ad-field">
            <label htmlFor="svc-desc">Description</label>
            <textarea
              id="svc-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What happens in this session, who it is for…"
            />
          </div>

          <div className="ad-grid-2">
            <div className="ad-field">
              <label htmlFor="svc-duration">Duration (minutes)</label>
              <input
                id="svc-duration"
                type="number"
                min={5}
                max={480}
                step={5}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              />
            </div>
            <div className="ad-field">
              <label htmlFor="svc-price">Price (USD, 0 = complimentary)</label>
              <input
                id="svc-price"
                type="number"
                min={0}
                step={1}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>

          <div className="ad-field">
            <label className="ad-check">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <span className="track" />
              Active — visible on the public booking page
            </label>
          </div>

          <div className="ad-modal-foot">
            <button className="ad-btn ghost" onClick={() => setModal(null)} disabled={saving}>
              Cancel
            </button>
            <button className="ad-btn primary" onClick={() => void save()} disabled={saving}>
              {saving ? 'Saving…' : modal.mode === 'add' ? 'Add service' : 'Save changes'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
