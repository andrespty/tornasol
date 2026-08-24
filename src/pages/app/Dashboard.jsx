import { useAuth } from '../../context/AuthContext'
import { useGroups } from '../../context/GroupContext'

export default function Dashboard() {
  const { profile } = useAuth()
  const { activeGroup } = useGroups()
  const firstName = (profile?.display_name || 'there').split(' ')[0]

  return (
    <div className="page stack-3">
      <div>
        <h1>Hello, {firstName}</h1>
        {activeGroup && <p className="muted">Caring together for {activeGroup.name}.</p>}
      </div>

      <div className="card center stack">
        <h2 style={{ marginBottom: 0 }}>Your summary is coming soon</h2>
        <p className="muted" style={{ marginBottom: 0 }}>
          Today's shifts, tasks, and recent notes will show up here. For now, use
          the tabs below to get around.
        </p>
      </div>
    </div>
  )
}
