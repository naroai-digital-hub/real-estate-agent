import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import '../admin.css'
import { Icon } from '../components/ui'
import Login from './Login'
import Sidebar, { NAV_ITEMS } from './Sidebar'
import Overview from './pages/Overview'
import AppointmentsPage from './pages/AppointmentsPage'
import ServicesPage from './pages/ServicesPage'
import BusinessHoursPage from './pages/BusinessHoursPage'
import BlockedDatesPage from './pages/BlockedDatesPage'
import SettingsPage from './pages/SettingsPage'

type AuthState = 'loading' | 'login' | 'unauthorized' | 'error' | 'admin'

/**
 * Full admin access check:
 * 1. getSession() — no session → login form
 * 2. getUser() — resolve the authenticated user
 * 3. admin_users lookup by user_id (never email) with maybeSingle()
 */
async function checkAdminAccess(): Promise<'admin' | 'unauthorized' | 'login'> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return 'login'

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return 'login'

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  return data ? 'admin' : 'unauthorized'
}

export default function AdminApp({ route }: { route: string }) {
  const [auth, setAuth] = useState<AuthState>('loading')
  const [userEmail, setUserEmail] = useState('')
  const [sideOpen, setSideOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const verify = useCallback(async (showLoading: boolean) => {
    if (showLoading) setAuth('loading')
    try {
      const result = await checkAdminAccess()
      setAuth(result)
      if (result === 'admin') {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUserEmail(user?.email ?? '')
      } else {
        setUserEmail('')
      }
    } catch {
      // Never sign out automatically on a transient error.
      // On first load show an error screen with retry; on background
      // re-checks keep whatever the UI was showing.
      if (showLoading) setAuth('error')
    }
  }, [])

  useEffect(() => {
    let mounted = true
    void (async () => {
      if (mounted) await verify(true)
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return
      if (event === 'SIGNED_OUT') {
        setAuth('login')
        setUserEmail('')
        return
      }
      // SIGNED_IN, TOKEN_REFRESHED, INITIAL_SESSION, USER_UPDATED:
      // re-check quietly so the dashboard survives token refreshes.
      void verify(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [verify])

  const refreshPending = useCallback(async () => {
    const { count } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
    setPendingCount(count ?? 0)
  }, [])

  // Pending-appointments badge for the sidebar.
  useEffect(() => {
    if (auth !== 'admin') return
    let alive = true
    const load = async () => {
      if (alive) await refreshPending()
    }
    void load()
    const id = window.setInterval(load, 30000)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [auth, route, refreshPending])

  const signOut = async () => {
    await supabase.auth.signOut()
    setAuth('login')
    setUserEmail('')
  }

  if (auth === 'loading') {
    return (
      <div className="auth-loading">
        <div className="box">
          <div className="spin" />
          <h2>Verifying access…</h2>
          <p>Checking your session and admin permissions.</p>
        </div>
      </div>
    )
  }

  if (auth === 'login') return <Login />

  if (auth === 'unauthorized') {
    return (
      <div className="auth-blocked">
        <div className="box">
          <div className="ad-empty" style={{ padding: 0 }}>
            <div className="ic">
              <Icon name="shield" />
            </div>
          </div>
          <h2>Not authorized</h2>
          <p>You are signed in, but you are not authorized as an admin.</p>
          <button className="ad-btn dark" onClick={signOut}>
            <Icon name="logout" /> Sign out
          </button>
        </div>
      </div>
    )
  }

  if (auth === 'error') {
    return (
      <div className="auth-blocked">
        <div className="box">
          <h2>Something went wrong</h2>
          <p>We could not verify your access just now. Your session was left untouched.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="ad-btn primary" onClick={() => void verify(true)}>
              Try again
            </button>
            <button className="ad-btn ghost" onClick={signOut}>
              <Icon name="logout" /> Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  const active = NAV_ITEMS.find((n) => n.path === route) ?? NAV_ITEMS[0]

  return (
    <div className="admin-root">
      <div className="ad-mobilebar">
        <b>{active.label}</b>
        <button onClick={() => setSideOpen(true)} aria-label="Open menu">
          <Icon name="menu" />
        </button>
      </div>

      {sideOpen && <div className="ad-side-scrim" onClick={() => setSideOpen(false)} />}
      <Sidebar
        route={route}
        userEmail={userEmail}
        pendingCount={pendingCount}
        open={sideOpen}
        onClose={() => setSideOpen(false)}
        onSignOut={signOut}
      />

      <div className="ad-main">
        <div className="ad-topbar">
          <div>
            <h1>{active.title}</h1>
            <p>{active.sub}</p>
          </div>
          <div className="ad-top-actions">
            <a className="ad-view-site" href="#/" target="_blank" rel="noreferrer">
              <Icon name="external" /> View website
            </a>
          </div>
        </div>

        <div className="ad-content">
          {active.key === 'overview' && <Overview />}
          {active.key === 'appointments' && <AppointmentsPage onChanged={refreshPending} />}
          {active.key === 'services' && <ServicesPage />}
          {active.key === 'hours' && <BusinessHoursPage />}
          {active.key === 'blocked' && <BlockedDatesPage />}
          {active.key === 'settings' && <SettingsPage />}
        </div>
      </div>
    </div>
  )
}
