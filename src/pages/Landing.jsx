import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/LanguageContext'
import Loading from '../components/Loading'
import { SunIcon } from '../components/icons'

export default function Landing() {
  const { isAuthenticated, loading } = useAuth()
  const { t } = useI18n()

  // Returning, logged-in users go straight to the app.
  if (loading) return <Loading label={t('common.opening')} />
  if (isAuthenticated) return <Navigate to="/app" replace />

  return (
    <div className="landing">
      <div className="container landing-inner">
        <div className="landing-mark">
          <SunIcon width={64} height={64} />
        </div>

        <h1 className="landing-title">Tornasol</h1>

        <p className="landing-lead">{t('landing.lead')}</p>

        <div className="card landing-card stack">
          <p>{t('landing.body')}</p>
          <p className="muted">{t('landing.tagline')}</p>
        </div>

        <Link to="/auth" className="btn btn-primary btn-block btn-lg landing-cta">
          {t('landing.getStarted')}
        </Link>

        <p className="muted center landing-signin">
          {t('landing.haveAccount')} <Link to="/auth">{t('landing.logIn')}</Link>
        </p>
      </div>
    </div>
  )
}
