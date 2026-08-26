import { useI18n } from '../context/LanguageContext'
import { SunIcon } from './icons'

/**
 * Friendly placeholder shown when Supabase credentials are not yet set.
 * Keeps the app from crashing during initial setup.
 */
export default function SetupNotice() {
  const { t } = useI18n()
  return (
    <div className="auth-page">
      <div className="container auth-inner">
        <div className="auth-brand">
          <SunIcon width={44} height={44} />
          <span>Tornasol</span>
        </div>
        <div className="card stack">
          <h1 style={{ marginBottom: 0 }}>{t('setup.title')}</h1>
          <p>{t('setup.body')}</p>
          <div className="alert alert-info">
            Add your Supabase project URL and anon key to a <code>.env</code>{' '}
            file (see <code>.env.example</code>), then restart the app.
          </div>
          <p className="muted">{t('setup.hint')}</p>
        </div>
      </div>
    </div>
  )
}
