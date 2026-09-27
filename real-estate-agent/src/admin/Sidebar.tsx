import { Icon, type IconName } from '../components/ui'

export interface NavItem {
  key: string
  label: string
  title: string
  sub: string
  path: string
  icon: IconName
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: 'overview',
    label: 'Overview',
    title: 'Overview',
    sub: 'Your bookings at a glance',
    path: '/admin',
    icon: 'trend',
  },
  {
    key: 'appointments',
    label: 'Appointments',
    title: 'Appointments',
    sub: 'Review and manage client bookings',
    path: '/admin/appointments',
    icon: 'calendar',
  },
  {
    key: 'services',
    label: 'Services',
    title: 'Services',
    sub: 'Consultations clients can book',
    path: '/admin/services',
    icon: 'briefcase',
  },
  {
    key: 'hours',
    label: 'Business Hours',
    title: 'Business Hours',
    sub: 'When clients can book you',
    path: '/admin/hours',
    icon: 'clock',
  },
  {
    key: 'blocked',
    label: 'Blocked Dates',
    title: 'Blocked Dates',
    sub: 'Holidays and days off',
    path: '/admin/blocked',
    icon: 'ban',
  },
  {
    key: 'settings',
    label: 'Business Settings',
    title: 'Business Settings',
    sub: 'Brand, contact and booking rules',
    path: '/admin/settings',
    icon: 'settings',
  },
]

export default function Sidebar({
  route,
  userEmail,
  pendingCount,
  open,
  onClose,
  onSignOut,
}: {
  route: string
  userEmail: string
  pendingCount: number
  open: boolean
  onClose: () => void
  onSignOut: () => void
}) {
  const initial = (userEmail.trim()[0] ?? 'A').toUpperCase()

  return (
    <aside className={`ad-side${open ? ' open' : ''}`}>
      <div className="ad-side-brand">
        <span className="mark">
          <Icon name="key" />
        </span>
        <div>
          <b>Agent Console</b>
          <span>Real Estate</span>
        </div>
      </div>

      <nav className="ad-nav">
        <div className="ad-nav-label">Manage</div>
        {NAV_ITEMS.map((n) => (
          <a
            key={n.key}
            href={`#${n.path}`}
            className={route === n.path ? 'active' : ''}
            onClick={onClose}
          >
            <Icon name={n.icon} />
            {n.label}
            {n.key === 'appointments' && pendingCount > 0 && (
              <span className="count">{pendingCount}</span>
            )}
          </a>
        ))}
      </nav>

      <div className="ad-side-foot">
        <div className="ad-user">
          <span className="avatar">{initial}</span>
          <div>
            <b>Admin</b>
            <span title={userEmail}>{userEmail}</span>
          </div>
        </div>
        <button className="ad-signout" onClick={onSignOut}>
          <Icon name="logout" /> Sign out
        </button>
      </div>
    </aside>
  )
}
