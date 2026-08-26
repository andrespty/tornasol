import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/LanguageContext'
import { friendlyError } from '../lib/errors'
import { initialsFor } from '../components/Avatar'
import Loading from '../components/Loading'
import SetupNotice from '../components/SetupNotice'
import { SunIcon } from '../components/icons'

const MODES = { LOGIN: 'login', SIGNUP: 'signup', FORGOT: 'forgot' }

export default function Auth() {
  const { isAuthenticated, loading } = useAuth()
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()

  const [mode, setMode] = useState(MODES.LOGIN)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  // When a signup needs email confirmation, we replace the whole screen with a
  // single clean message (no lingering email/password form).
  const [confirmationSent, setConfirmationSent] = useState(false)

  const redirectTo = location.state?.from || '/app'

  if (loading) return <Loading label={t('common.opening')} />
  if (isAuthenticated) return <Navigate to={redirectTo} replace />
  if (!isSupabaseConfigured) return <SetupNotice />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)

    try {
      if (mode === MODES.FORGOT) {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (err) throw err
        setNotice(t('auth.resetSent'))
        return
      }

      if (mode === MODES.SIGNUP) {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: name.trim() || email.split('@')[0],
              avatar_initials: initialsFor(name.trim() || email),
            },
          },
        })
        if (err) throw err

        // Supabase does not error on duplicate signups when email confirmation
        // is enabled (to avoid leaking who has an account) — instead it returns
        // a user with an empty `identities` array. Treat that as "already
        // registered" and stop, rather than showing a confirmation message.
        const identities = data?.user?.identities
        if (Array.isArray(identities) && identities.length === 0) {
          setError(t('auth.dupAccount'))
          return
        }

        // With email confirmation off, the session is active immediately.
        // With it on, replace the screen with a single clean message.
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData.session) {
          setConfirmationSent(true)
          return
        }
        navigate(redirectTo, { replace: true })
        return
      }

      // Login
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (err) throw err
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const isForgot = mode === MODES.FORGOT
  const isSignup = mode === MODES.SIGNUP

  // After a signup that needs email confirmation: show ONLY the message.
  if (confirmationSent) {
    return (
      <div className="auth-page">
        <div className="container auth-inner">
          <Link to="/" className="auth-brand" aria-label={t('nav.homeAria')}>
            <SunIcon width={44} height={44} />
            <span>Tornasol</span>
          </Link>
          <div className="card stack center">
            <h1 style={{ marginBottom: 0 }}>{t('auth.checkEmailTitle')}</h1>
            <div className="alert alert-success" role="status">
              {t('auth.checkEmailMsg', { email: email.trim() })}
            </div>
            <p className="muted" style={{ marginBottom: 0 }}>
              {t('auth.checkEmailHint')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="container auth-inner">
        <Link to="/" className="auth-brand" aria-label={t('nav.homeAria')}>
          <SunIcon width={44} height={44} />
          <span>Tornasol</span>
        </Link>

        {!isForgot && (
          <div className="segmented" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === MODES.LOGIN}
              className={`segmented-btn${mode === MODES.LOGIN ? ' is-active' : ''}`}
              onClick={() => {
                setMode(MODES.LOGIN)
                setError('')
                setNotice('')
              }}
            >
              {t('auth.tabLogin')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === MODES.SIGNUP}
              className={`segmented-btn${mode === MODES.SIGNUP ? ' is-active' : ''}`}
              onClick={() => {
                setMode(MODES.SIGNUP)
                setError('')
                setNotice('')
              }}
            >
              {t('auth.tabSignup')}
            </button>
          </div>
        )}

        <div className="card stack">
          <h1 style={{ marginBottom: 0 }}>
            {isForgot ? t('auth.resetTitle') : isSignup ? t('auth.signupTitle') : t('auth.welcome')}
          </h1>

          {isForgot && <p className="muted">{t('auth.forgotIntro')}</p>}

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="alert alert-success" role="status">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="stack">
            {isSignup && (
              <label className="field">
                <span className="field-label">{t('auth.name')}</span>
                <input
                  className="input"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('auth.namePlaceholder')}
                  required
                />
              </label>
            )}

            <label className="field">
              <span className="field-label">{t('auth.email')}</span>
              <input
                className="input"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            {!isForgot && (
              <label className="field">
                <span className="field-label">{t('auth.password')}</span>
                <input
                  className="input"
                  type="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? t('auth.passwordNewPlaceholder') : t('auth.passwordPlaceholder')}
                  minLength={6}
                  required
                />
              </label>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={busy}
            >
              {busy
                ? t('common.pleaseWait')
                : isForgot
                  ? t('auth.sendReset')
                  : isSignup
                    ? t('auth.tabSignup')
                    : t('auth.tabLogin')}
            </button>
          </form>

          {!isForgot ? (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setMode(MODES.FORGOT)
                setError('')
                setNotice('')
              }}
            >
              {t('auth.forgot')}
            </button>
          ) : (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setMode(MODES.LOGIN)
                setError('')
                setNotice('')
              }}
            >
              {t('auth.backToLogin')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
