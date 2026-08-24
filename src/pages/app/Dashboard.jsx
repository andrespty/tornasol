import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGroups } from '../../context/GroupContext'
import { fetchShifts, fetchGroupMembers } from '../../lib/api'
import { expandShiftOccurrences, startOfDay, addDays, formatTimeRange, isToday } from '../../lib/date'
import { InlineLoading } from '../../components/Loading'
import CreateGroupCard from '../../components/CreateGroupCard'
import Avatar from '../../components/Avatar'
import { CalendarIcon, TasksIcon, NotesIcon } from '../../components/icons'

export default function Dashboard() {
  const { profile, user } = useAuth()
  const { activeGroup, activeGroupId, hasNoGroups, loading: groupsLoading } = useGroups()

  const [shifts, setShifts] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeGroupId) return
    let active = true
    setLoading(true)
    Promise.all([fetchShifts(activeGroupId), fetchGroupMembers(activeGroupId)]).then(
      ([shiftRes, memberRes]) => {
        if (!active) return
        setShifts(shiftRes.data || [])
        setMembers(memberRes.data || [])
        setLoading(false)
      }
    )
    return () => {
      active = false
    }
  }, [activeGroupId])

  const memberById = useMemo(() => {
    const map = new Map()
    members.forEach((m) => map.set(m.userId, m))
    return map
  }, [members])

  const todaysShifts = useMemo(() => {
    const dayStart = startOfDay(new Date())
    const dayEnd = addDays(dayStart, 1)
    const all = []
    shifts.forEach((s) => {
      expandShiftOccurrences(s, dayStart, dayEnd).forEach((occ) => {
        if (isToday(occ.occurrence_start)) all.push(occ)
      })
    })
    return all.sort((a, b) => a.occurrence_start - b.occurrence_start)
  }, [shifts])

  const firstName = (profile?.display_name || 'there').split(' ')[0]

  if (groupsLoading) {
    return (
      <div className="page">
        <InlineLoading label="Loading your groups…" />
      </div>
    )
  }

  if (hasNoGroups) {
    return (
      <div className="page stack-3">
        <div>
          <h1>Welcome, {firstName}</h1>
          <p className="muted">
            Create a care team to get started, or open an invite link someone
            sent you.
          </p>
        </div>
        <CreateGroupCard />
      </div>
    )
  }

  return (
    <div className="page stack-3">
      <div>
        <h1>Hello, {firstName}</h1>
        {activeGroup && <p className="muted">Caring together for {activeGroup.name}.</p>}
      </div>

      <section>
        <h2>Today</h2>
        {loading ? (
          <InlineLoading />
        ) : todaysShifts.length === 0 ? (
          <div className="card">
            <p style={{ marginBottom: 0 }}>No shifts scheduled for today.</p>
          </div>
        ) : (
          <div className="stack">
            {todaysShifts.map((occ, i) => {
              const assignee = occ.assigned_user_id ? memberById.get(occ.assigned_user_id) : null
              return (
                <div key={`${occ.id}-${i}`} className="card shift-row">
                  <div>
                    <div className="shift-time">
                      {formatTimeRange(occ.occurrence_start, occ.occurrence_end)}
                    </div>
                    {assignee ? (
                      <div className="shift-assignee">
                        <Avatar name={assignee.name} initials={assignee.initials} size="sm" />
                        <span>
                          {assignee.userId === user?.id ? 'You' : assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="pill pill-open">Open — needs someone</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <Link
          to="/app/calendar"
          className="btn btn-outline btn-block"
          style={{ marginTop: 'var(--space-2)' }}
        >
          See the calendar
        </Link>
      </section>

      <section>
        <h2>Quick links</h2>
        <div className="quick-links">
          <Link to="/app/calendar" className="quick-link">
            <CalendarIcon />
            <span>Shifts</span>
          </Link>
          <Link to="/app/tasks" className="quick-link">
            <TasksIcon />
            <span>Tasks</span>
          </Link>
          <Link to="/app/notes" className="quick-link">
            <NotesIcon />
            <span>Notes</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
