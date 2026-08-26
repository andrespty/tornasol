import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGroups } from '../context/GroupContext'
import { useI18n } from '../context/LanguageContext'
import Avatar from './Avatar'
import NoGroupGate from './NoGroupGate'
import GroupSwitcher from './GroupSwitcher'
import { SunIcon, CalendarIcon, TasksIcon, NotesIcon, PeopleIcon, HomeIcon } from './icons'

const NAV = [
  { to: '/app', key: 'nav.home', icon: HomeIcon, end: true },
  { to: '/app/calendar', key: 'nav.events', icon: CalendarIcon },
  { to: '/app/tasks', key: 'nav.tasks', icon: TasksIcon },
  { to: '/app/notes', key: 'nav.notes', icon: NotesIcon },
  { to: '/app/group', key: 'nav.group', icon: PeopleIcon },
]

export default function AppLayout() {
  const { profile, user } = useAuth()
  const { hasNoGroups } = useGroups()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()

  // The profile/settings page stays reachable even with no group, so a user can
  // create a group or log out there. Every other tab is gated.
  const onProfile = location.pathname.startsWith('/app/profile')
  const showGate = hasNoGroups && !onProfile

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          type="button"
          className="app-brand"
          onClick={() => navigate('/app')}
          aria-label={t('nav.homeAria')}
        >
          <SunIcon />
          <span className="app-brand-name">Tornasol</span>
        </button>

        <div className="app-header-center">
          <GroupSwitcher />
        </div>

        <button
          type="button"
          className="profile-btn"
          onClick={() => navigate('/app/profile')}
          aria-label={t('nav.profileAria')}
        >
          <Avatar
            name={profile?.display_name || user?.email}
            initials={profile?.avatar_initials}
          />
        </button>
      </header>

      <main className="app-main">
        <div className="container">{showGate ? <NoGroupGate /> : <Outlet />}</div>
      </main>

      <nav className="bottom-nav" aria-label="Main">
        {NAV.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' is-active' : ''}`}
          >
            <Icon />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
