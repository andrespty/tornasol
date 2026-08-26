import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGroups } from '../../context/GroupContext'
import { fetchEvents, fetchAttendeesForGroup, fetchTasks, setTaskComplete } from '../../lib/api'
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh'
import { InlineLoading } from '../../components/Loading'
import {
  startOfDay,
  relativeDay,
  formatEventWhen,
  formatDateShort,
  parseDateOnly,
} from '../../lib/date'
import { CalendarIcon, TasksIcon } from '../../components/icons'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { activeGroup, activeGroupId } = useGroups()
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [attendees, setAttendees] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!activeGroupId) return
    const [evRes, attRes, taskRes] = await Promise.all([
      fetchEvents(activeGroupId),
      fetchAttendeesForGroup(activeGroupId),
      fetchTasks(activeGroupId),
    ])
    setEvents(evRes.data || [])
    setAttendees(attRes.data || [])
    setTasks(taskRes.data || [])
    setLoading(false)
  }, [activeGroupId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useRealtimeRefresh(
    'events',
    { filter: `group_id=eq.${activeGroupId}`, channelKey: `home-events-${activeGroupId}`, enabled: !!activeGroupId },
    load
  )
  useRealtimeRefresh(
    'event_attendees',
    { channelKey: `home-att-${activeGroupId}`, enabled: !!activeGroupId },
    load
  )
  useRealtimeRefresh(
    'tasks',
    { filter: `group_id=eq.${activeGroupId}`, channelKey: `home-tasks-${activeGroupId}`, enabled: !!activeGroupId },
    load
  )

  // Events I'm signed up for, from today onward.
  const myEvents = useMemo(() => {
    const mine = new Set(
      attendees.filter((a) => a.user_id === user?.id).map((a) => a.event_id)
    )
    const todayStart = startOfDay(new Date()).getTime()
    return events
      .filter((ev) => mine.has(ev.id) && startOfDay(ev.start_time).getTime() >= todayStart)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  }, [events, attendees, user])

  // Incomplete tasks assigned to me.
  const myTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.assigned_user_id === user?.id && !t.is_complete)
        .sort((a, b) => {
          const ad = a.due_date || '9999'
          const bd = b.due_date || '9999'
          return ad.localeCompare(bd)
        }),
    [tasks, user]
  )

  async function completeTask(task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_complete: true } : t)))
    const { error: err } = await setTaskComplete(task.id, true)
    if (err) load()
  }

  const firstName = (profile?.display_name || 'there').split(' ')[0]

  return (
    <div className="page stack-3">
      <div>
        <h1>Hello, {firstName}</h1>
        {activeGroup && <p className="muted">Here's what you have on for {activeGroup.name}.</p>}
      </div>

      {loading ? (
        <InlineLoading />
      ) : (
        <>
          <section className="stack">
            <div className="home-head">
              <h2 style={{ margin: 0 }}>Your events</h2>
              <button className="link-btn" onClick={() => navigate('/app/calendar')}>
                See calendar
              </button>
            </div>

            {myEvents.length === 0 ? (
              <div className="card home-empty">
                <CalendarIcon />
                <p style={{ margin: 0 }}>
                  You're not signed up for any upcoming events. Open the calendar
                  to find one.
                </p>
              </div>
            ) : (
              <div className="stack">
                {myEvents.map((ev) => (
                  <button
                    key={ev.id}
                    className="card event-card"
                    style={{ borderLeftColor: ev.type?.color || 'var(--color-border)' }}
                    onClick={() => navigate('/app/calendar')}
                  >
                    <div className="event-card-top">
                      <span className="event-card-time">{relativeDay(ev.start_time)}</span>
                      {ev.type && (
                        <span className="type-badge" style={{ backgroundColor: ev.type.color }}>
                          {ev.type.name}
                        </span>
                      )}
                    </div>
                    {ev.title && <div className="event-card-title">{ev.title}</div>}
                    <div className="muted" style={{ fontWeight: 700 }}>{formatEventWhen(ev)}</div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="stack">
            <div className="home-head">
              <h2 style={{ margin: 0 }}>Your tasks</h2>
              <button className="link-btn" onClick={() => navigate('/app/tasks')}>
                See all tasks
              </button>
            </div>

            {myTasks.length === 0 ? (
              <div className="card home-empty">
                <TasksIcon />
                <p style={{ margin: 0 }}>Nothing assigned to you right now.</p>
              </div>
            ) : (
              <ul className="task-list">
                {myTasks.map((t) => (
                  <li key={t.id} className="task-item">
                    <button
                      className="task-check"
                      onClick={() => completeTask(t)}
                      aria-label="Mark as done"
                    />
                    <div className="task-body">
                      <span className="task-title">{t.title}</span>
                      {t.due_date && (
                        <span className="task-meta">
                          <span className="task-date">{formatDateShort(parseDateOnly(t.due_date))}</span>
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
