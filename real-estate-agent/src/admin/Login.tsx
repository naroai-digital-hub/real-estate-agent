import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Icon, SmartImage } from '../components/ui'
import { IMAGES } from '../lib/images'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signInError) {
        setError(
          signInError.message.includes('Invalid login credentials')
            ? 'Invalid email or password. Please try again.'
            : signInError.message
        )
        return
      }
      // Success: AdminApp's onAuthStateChange picks up the session
      // and runs the admin check. Nothing else to do here.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="mark">
            <Icon name="key" />
          </div>
          <h1>Agent dashboard</h1>
          <p>Sign in to manage appointments, services and your booking settings.</p>

          {!isSupabaseConfigured && (
            <div className="auth-error" role="alert">
              <Icon name="alert" />
              <span>
                Supabase is not configured yet. Add your project URL and
                publishable key to <b>.env.local</b>, then reload.
              </span>
            </div>
          )}

          {error && (
            <div className="auth-error" role="alert">
              <Icon name="alert" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit}>
            <div className="ad-field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="ad-field">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="ad-btn primary"
              style={{ width: '100%', padding: '14px', marginTop: 6 }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in to dashboard'}
            </button>
          </form>

          <p style={{ marginTop: 26, fontSize: 13, color: 'var(--ad-muted)' }}>
            <a href="#/" style={{ color: 'var(--ad-gold)', fontWeight: 600, textDecoration: 'none' }}>
              ← Back to website
            </a>
          </p>
        </div>
      </div>

      <div className="auth-visual">
        <SmartImage src={IMAGES.adminLogin} alt="Luxury modern home exterior" />
        <div className="veil" />
        <div className="auth-quote">
          <p>
            “Every appointment is a relationship. This is where you run them
            beautifully.”
          </p>
          <span>Muse Property Group · Agent Console</span>
        </div>
      </div>
    </div>
  )
}
