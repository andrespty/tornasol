import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGroups } from '../../context/GroupContext'
import { useI18n } from '../../context/LanguageContext'
import Avatar from '../../components/Avatar'
import CreateGroupCard from '../../components/CreateGroupCard'
import { CheckIcon, PlusIcon } from '../../components/icons'

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const { groups, activeGroupId, setActiveGroupId } = useGroups()
  const { t, lang, setLang } = useI18n()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  function chooseGroup(id) {
    setActiveGroupId(id)
    navigate('/app')
  }

  return (
    <div className="page stack-3">
      <h1>{t('profile.title')}</h1>

      {/* Account */}
      <section className="card stack">
        <div className="profile-identity">
          <Avatar
            name={profile?.display_name || user?.email}
            initials={profile?.avatar_initials}
            size="lg"
          />
          <div>
            <div className="profile-name">{profile?.display_name || t('common.you')}</div>
            <div className="muted">{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-block" onClick={signOut}>
          {t('profile.logOut')}
        </button>
      </section>

      {/* Language */}
      <section className="card stack">
        <h2 style={{ marginBottom: 0 }}>{t('profile.language')}</h2>
        <p className="muted" style={{ margin: 0 }}>{t('profile.languageIntro')}</p>
        <div className="segmented" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={lang === 'en'}
            className={`segmented-btn${lang === 'en' ? ' is-active' : ''}`}
            onClick={() => setLang('en')}
          >
            English
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={lang === 'es'}
            className={`segmented-btn${lang === 'es' ? ' is-active' : ''}`}
            onClick={() => setLang('es')}
          >
            Español
          </button>
        </div>
      </section>

      {/* Groups */}
      <section className="card stack">
        <h2 style={{ marginBottom: 0 }}>{t('profile.yourTeams')}</h2>
        {groups.length === 0 ? (
          <p className="muted" style={{ marginBottom: 0 }}>{t('profile.noTeams')}</p>
        ) : (
          <ul className="group-list">
            {groups.map((g) => {
              const isActive = g.id === activeGroupId
              return (
                <li key={g.id}>
                  <button
                    className={`group-list-item${isActive ? ' is-active' : ''}`}
                    onClick={() => chooseGroup(g.id)}
                  >
                    <span className="group-list-name">{g.name}</span>
                    {isActive ? (
                      <span className="pill pill-taken">
                        <CheckIcon width={16} height={16} /> {t('profile.active')}
                      </span>
                    ) : (
                      <span className="muted group-list-switch">{t('profile.switch')}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Create another group */}
      {creating ? (
        <div className="stack">
          <CreateGroupCard onCreated={() => setCreating(false)} />
          <button className="link-btn" onClick={() => setCreating(false)}>
            {t('common.cancel')}
          </button>
        </div>
      ) : (
        <section className="card stack">
          <h2 style={{ marginBottom: 0 }}>{t('profile.startAnother')}</h2>
          <p className="muted" style={{ marginBottom: 0 }}>{t('profile.startAnotherIntro')}</p>
          <button className="btn btn-primary btn-block" onClick={() => setCreating(true)}>
            <PlusIcon width={20} height={20} /> {t('profile.newTeam')}
          </button>
        </section>
      )}
    </div>
  )
}
