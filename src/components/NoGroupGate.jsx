import { useI18n } from '../context/LanguageContext'
import CreateGroupCard from './CreateGroupCard'
import { SunIcon } from './icons'

/**
 * Shown in place of any /app screen when the user belongs to no care groups.
 * Nothing in the app works without a group, so we funnel everyone straight to
 * creating (or being invited to) one.
 */
export default function NoGroupGate() {
  const { t } = useI18n()
  return (
    <div className="page stack-3">
      <div className="center stack">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SunIcon width={56} height={56} />
        </div>
        <h1 style={{ marginBottom: 0 }}>{t('gate.title')}</h1>
        <p className="muted" style={{ marginBottom: 0 }}>{t('gate.body')}</p>
      </div>
      <CreateGroupCard />
    </div>
  )
}
