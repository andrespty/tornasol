import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { friendlyError } from '../lib/errors'
import Loading from '../components/Loading'
import { SunIcon } from '../components/icons'

const PENDING_INVITE_KEY = 'tornasol-pending-invite'
const ACTIVE_GROUP_KEY = 'tornasol-active-group'

export default function InviteAccept() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()

  const [groupName, setGroupName] = useState(null)
  const [status, setStatus] = useState('checking') // checking | invalid | ready | joining | joined | error
  const [error, setError] = useState('')

  // Look up the group name behind the invite (works before sign-in).
  useEffect(() => {
    let active = true
    supabase
      .rpc('invite_group_name', { invite_token: token })
      .then(({ data, error: err }) => {
        if (!active) return
        if (err || !data) {
          setStatus('invalid')
        } else {
          setGroupName(data)
          setStatus('ready')
        }
      })
    return () => {
      active = false
    }
  }, [token])

  async function join() {
    setStatus('joining')
    setError('')
    try {
      const { data, error: err } = await supabase.rpc('accept_invite', {
        invite_token: token,
      })
      if (err) throw err
      window.localStorage.removeItem(PENDING_INVITE_KEY)
      if (data) window.localStorage.setItem(ACTIVE_GROUP_KEY, data)
      setStatus('joined')
      setTimeout(() => navigate('/app', { replace: true }), 1200)
    } catch (err) {
      setError(friendlyError(err))
      setStatus('error')
    }
  }

  function goSignUp() {
    // Preserve the invite through the auth flow and come back here after.
    window.localStorage.setItem(PENDING_INVITE_KEY, token)
    navigate('/auth', { state: { from: `/invite/${token}` } })
  }

  // Once authenticated and the invite is valid, join automatically.
  useEffect(() => {
    if (loading) return
    if (isAuthenticated && status === 'ready') {
      join()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loading, status])

  if (loading || status === 'checking') {
    return <Loading label="Opening your invite…" />
  }

  return (
    <div className="auth-page">
      <div className="container auth-inner">
        <div className="auth-brand">
          <SunIcon width={44} height={44} />
          <span>Tornasol</span>
        </div>

        <div className="card stack center">
          {status === 'invalid' && (
            <>
              <h1>This invite is not valid</h1>
              <p className="muted">
                The link may have expired or already been used. Please ask the
                person who invited you to send a new one.
              </p>
              <button
                className="btn btn-ghost btn-block"
                onClick={() => navigate('/')}
              >
                Go to start
              </button>
            </>
          )}

          {status === 'ready' && !isAuthenticated && (
            <>
              <h1>You're invited!</h1>
              <p>
                Join <strong>{groupName}</strong> to help coordinate care
                together.
              </p>
              <button className="btn btn-primary btn-block btn-lg" onClick={goSignUp}>
                Create your account
              </button>
              <p className="muted">
                Already have an account?{' '}
                <button className="link-btn" onClick={goSignUp}>
                  Log in to join
                </button>
              </p>
            </>
          )}

          {status === 'joining' && (
            <>
              <div className="spinner" style={{ margin: '0 auto' }} />
              <p className="muted">Joining {groupName}…</p>
            </>
          )}

          {status === 'joined' && (
            <>
              <h1>You're in!</h1>
              <p>
                Welcome to <strong>{groupName}</strong>. Taking you to the app…
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <h1>We couldn't add you</h1>
              <div className="alert alert-error" role="alert">
                {error}
              </div>
              <button className="btn btn-primary btn-block" onClick={join}>
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
