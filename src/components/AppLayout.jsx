import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useGroups } from '../context/GroupContext'
import { SunIcon, CalendarIcon, TasksIcon, NotesIcon, PeopleIcon, HomeIcon } from './icons'

const NAV = [
  { to: '/app', label: 'Home', icon: HomeIcon, end: true },
  { to: '/app/calendar', label: 'Shifts', icon: CalendarIcon },
  { to: '/app/tasks', label: 'Tasks', icon: TasksIcon },
  { to: '/app/notes', label: 'Notes', icon: NotesIcon },
  { to: '/app/group', label: 'Group', icon: PeopleIcon },
]

export default function AppLayout() {
  const { activeGroup, groups, setActiveGroupId } = useGroups()
  const navigate = useNavigate()

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
          <span>Tornasol</span>
        </button>

        {groups.length > 1 ? (
          <label className="group-switch">
            <span className="visually-hidden">Active care group</span>
            <select
              className="select group-select"
              value={activeGroup?.id || ''}
              onChange={(e) => setActiveGroupId(e.target.value)}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        ) : activeGroup ? (
          <span className="group-name-tag" title={activeGroup.name}>
            {activeGroup.name}
          </span>
        ) : null}
      </header>

      <main className="app-main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <nav className="bottom-nav" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? ' is-active' : ''}`
            }
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
