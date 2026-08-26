import { Link } from 'react-router-dom'
import { useI18n } from '../context/LanguageContext'
import { SunIcon } from '../components/icons'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <div className="auth-page">
      <div className="container auth-inner">
        <div className="auth-brand">
          <SunIcon width={44} height={44} />
          <span>Tornasol</span>
        </div>
        <div className="card stack center">
          <h1>{t('notfound.title')}</h1>
          <p className="muted">{t('notfound.body')}</p>
          <Link to="/app" className="btn btn-primary btn-block">
            {t('common.goHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
