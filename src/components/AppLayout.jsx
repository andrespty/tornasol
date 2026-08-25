import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGroups } from '../context/GroupContext'
import Avatar from './Avatar'
import NoGroupGate from './NoGroupGate'
import GroupSwitcher from './GroupSwitcher'
import { SunIcon, CalendarIcon, TasksIcon, NotesIcon, PeopleIcon, HomeIcon } from './icons'

const NAV = [
  { to: '/app', label: 'Home', icon: HomeIcon, end: true },
  { to: '/app/calendar', label: 'Events', icon: CalendarIcon },
  { to: '/app/tasks', label: 'Tasks', icon: TasksIcon },
  { to: '/app/notes', label: 'Notes', icon: NotesIcon },
  { to: '/app/group', label: 'Group', icon: PeopleIcon },
]

export default function AppLayout() {
  const { profile, user } = useAuth()
  const { hasNoGroups } = useGroups()
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
          aria-label="Tornasol home"
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
          aria-label="Your profile and settings"
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
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' is-active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
