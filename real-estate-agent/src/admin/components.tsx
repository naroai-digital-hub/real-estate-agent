import type { ReactNode } from 'react'
import { Icon, type IconName } from '../components/ui'

// Shared admin primitives: badges, cards, modals, notices, empty states.

export function Badge({ value }: { value: string }) {
  return <span className={`badge ${value}`}>{value}</span>
}

export function StatCard({
  icon,
  tone,
  value,
  label,
}: {
  icon: IconName
  tone: 'gold' | 'green' | 'amber' | 'blue'
  value: string | number
  label: string
}) {
  return (
    <div className="ad-card ad-stat">
      <div className={`ic ${tone}`}>
        <Icon name={icon} />
      </div>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: IconName
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="ad-empty">
      <div className="ic">
        <Icon name={icon} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}

export function Modal({
  title,
  sub,
  onClose,
  children,
}: {
  title: string
  sub?: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="ad-modal-veil" onClick={onClose}>
      <div
        className="ad-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ad-modal-head">
          <div>
            <h3>{title}</h3>
            {sub && <p>{sub}</p>}
          </div>
          <button className="ad-modal-x" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="ad-modal-body">{children}</div>
      </div>
    </div>
  )
}

export function Notice({
  kind,
  children,
}: {
  kind: 'ok' | 'err'
  children: ReactNode
}) {
  return (
    <div className={`ad-notice ${kind}`} role="status">
      <Icon name={kind === 'ok' ? 'check' : 'alert'} />
      <div>{children}</div>
    </div>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="ad-empty">
      <div className="auth-loading" style={{ minHeight: 0 }}>
        <div className="box">
          <div className="spin" />
          {label && <p style={{ margin: 0 }}>{label}</p>}
        </div>
      </div>
    </div>
  )
}
