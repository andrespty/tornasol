import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGroups } from '../../context/GroupContext'
import Avatar from '../../components/Avatar'
import CreateGroupCard from '../../components/CreateGroupCard'
import { CheckIcon, PlusIcon } from '../../components/icons'

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const { groups, activeGroupId, setActiveGroupId } = useGroups()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  function chooseGroup(id) {
    setActiveGroupId(id)
    navigate('/app')
  }

  return (
    <div className="page stack-3">
      <h1>Profile &amp; settings</h1>

      {/* Account */}
      <section className="card stack">
        <div className="profile-identity">
          <Avatar
            name={profile?.display_name || user?.email}
            initials={profile?.avatar_initials}
            size="lg"
          />
          <div>
            <div className="profile-name">{profile?.display_name || 'You'}</div>
            <div className="muted">{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-block" onClick={signOut}>
          Log out
        </button>
      </section>

      {/* Groups */}
      <section className="card stack">
        <h2 style={{ marginBottom: 0 }}>Your care teams</h2>
        {groups.length === 0 ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            You're not in any care team yet. Create one below.
          </p>
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
                        <CheckIcon width={16} height={16} /> Active
                      </span>
                    ) : (
                      <span className="muted group-list-switch">Switch</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Create another group — the one place to do this once you're in a group */}
      {creating ? (
        <div className="stack">
          <CreateGroupCard onCreated={() => setCreating(false)} />
          <button className="link-btn" onClick={() => setCreating(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <section className="card stack">
          <h2 style={{ marginBottom: 0 }}>Start another care team</h2>
          <p className="muted" style={{ marginBottom: 0 }}>
            You can care for more than one person. Each team has its own shifts,
            notes, and members.
          </p>
          <button className="btn btn-primary btn-block" onClick={() => setCreating(true)}>
            <PlusIcon width={20} height={20} /> New care team
          </button>
        </section>
      )}
    </div>
  )
}
