import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGroups } from '../../context/GroupContext'
import {
  fetchTasks,
  createTask,
  setTaskComplete,
  deleteTask,
  fetchGroupMembers,
} from '../../lib/api'
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh'
import { InlineLoading } from '../../components/Loading'
import Avatar from '../../components/Avatar'
import CreateGroupCard from '../../components/CreateGroupCard'
import { friendlyError } from '../../lib/errors'
import { CheckIcon, TrashIcon } from '../../components/icons'

export default function Tasks() {
  const { user } = useAuth()
  const { activeGroupId, hasNoGroups } = useGroups()

  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('') // '' = shared
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!activeGroupId) return
    const [taskRes, memberRes] = await Promise.all([
      fetchTasks(activeGroupId),
      fetchGroupMembers(activeGroupId),
    ])
    setTasks(taskRes.data || [])
    setMembers(memberRes.data || [])
    setLoading(false)
  }, [activeGroupId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useRealtimeRefresh(
    'tasks',
    { filter: `group_id=eq.${activeGroupId}`, channelKey: `tasks-${activeGroupId}`, enabled: !!activeGroupId },
    load
  )

  const { open, done } = useMemo(() => {
    const o = tasks.filter((t) => !t.is_complete)
    const d = tasks.filter((t) => t.is_complete)
    return { open: o, done: d }
  }, [tasks])

  async function handleAdd(e) {
    e.preventDefault()
    const text = title.trim()
    if (!text) return
    setBusy(true)
    setError('')
    try {
      const { error: err } = await createTask({
        group_id: activeGroupId,
        created_by: user.id,
        title: text,
        assigned_user_id: assignee || null,
        is_shared: !assignee,
      })
      if (err) throw err
      setTitle('')
      setAssignee('')
      await load()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function toggle(task) {
    // Optimistic flip; realtime/load will reconcile.
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_complete: !t.is_complete } : t))
    )
    const { error: err } = await setTaskComplete(task.id, !task.is_complete)
    if (err) load()
  }

  async function remove(task) {
    if (!window.confirm('Delete this task?')) return
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    const { error: err } = await deleteTask(task.id)
    if (err) load()
  }

  if (hasNoGroups) {
    return (
      <div className="page stack-3">
        <h1>Tasks</h1>
        <p className="muted">Create a care team to start a shared to-do list.</p>
        <CreateGroupCard />
      </div>
    )
  }

  return (
    <div className="page stack-3">
      <div>
        <h1>Tasks</h1>
        <p className="muted">Shared to-dos for the care team — anyone can help.</p>
      </div>

      <form onSubmit={handleAdd} className="card stack">
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        <label className="field" style={{ marginBottom: 0 }}>
          <span className="field-label">Add a task</span>
          <input
            className="input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Refill prescription"
            required
          />
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          <span className="field-label">Who's it for?</span>
          <select
            className="select"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          >
            <option value="">Anyone (shared)</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.userId === user?.id ? 'Me' : m.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Adding…' : 'Add task'}
        </button>
      </form>

      {loading ? (
        <InlineLoading label="Loading tasks…" />
      ) : (
        <>
          <section className="stack">
            <h2>To do</h2>
            {open.length === 0 ? (
              <div className="card">
                <p style={{ marginBottom: 0 }}>All caught up. Nothing to do right now.</p>
              </div>
            ) : (
              <ul className="task-list">
                {open.map((t) => (
                  <TaskItem key={t.id} task={t} user={user} onToggle={toggle} onDelete={remove} />
                ))}
              </ul>
            )}
          </section>

          {done.length > 0 && (
            <section className="stack">
              <h2>Done</h2>
              <ul className="task-list">
                {done.map((t) => (
                  <TaskItem key={t.id} task={t} user={user} onToggle={toggle} onDelete={remove} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function TaskItem({ task, user, onToggle, onDelete }) {
  const assigneeName = task.assignee?.display_name || task.assignee?.email
  const isMine = task.assigned_user_id === user?.id
  return (
    <li className={`task-item${task.is_complete ? ' is-done' : ''}`}>
      <button
        className="task-check"
        onClick={() => onToggle(task)}
        aria-pressed={task.is_complete}
        aria-label={task.is_complete ? 'Mark as not done' : 'Mark as done'}
      >
        {task.is_complete && <CheckIcon width={22} height={22} />}
      </button>

      <div className="task-body">
        <span className="task-title">{task.title}</span>
        {task.is_shared ? (
          <span className="pill pill-admin task-tag">Shared</span>
        ) : (
          <span className="task-assignee">
            <Avatar name={assigneeName} initials={task.assignee?.avatar_initials} size="sm" />
            {isMine ? 'You' : assigneeName || 'Someone'}
          </span>
        )}
      </div>

      <button className="icon-btn" onClick={() => onDelete(task)} aria-label="Delete task">
        <TrashIcon />
      </button>
    </li>
  )
}
