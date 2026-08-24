import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { friendlyError } from '../lib/errors'
import { SunIcon } from '../components/icons'

/**
 * Opened from the password-reset email link. Supabase establishes a recovery
 * session automatically (detectSessionInUrl), then the user picks a new
 * password here.
 */
export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // A recovery event fires when the link is opened; also handle the case
    // where the session is already present.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Please choose a password with at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Those passwords do not match. Please type them again.')
      return
    }
    setBusy(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setDone(true)
      setTimeout(() => navigate('/app', { replace: true }), 1800)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="container auth-inner">
        <div className="auth-brand">
          <SunIcon width={44} height={44} />
          <span>Tornasol</span>
        </div>

        <div className="card stack">
          <h1 style={{ marginBottom: 0 }}>Set a new password</h1>

          {done ? (
            <div className="alert alert-success" role="status">
              Your password is updated. Taking you into Tornasol…
            </div>
          ) : !ready ? (
            <p className="muted">
              Open this page from the link we emailed you on this phone. If you
              are seeing this, the link may have expired — please request a new
              one.
            </p>
          ) : (
            <>
              {error && (
                <div className="alert alert-error" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="stack">
                <label className="field">
                  <span className="field-label">New password</span>
                  <input
                    className="input"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                  />
                </label>
                <label className="field">
                  <span className="field-label">Type it again</span>
                  <input
                    className="input"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={busy}
                >
                  {busy ? 'Please wait…' : 'Save new password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
