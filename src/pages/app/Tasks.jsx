import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGroups } from '../../context/GroupContext'
import { useI18n } from '../../context/LanguageContext'
import {
  fetchTasks,
  setTaskComplete,
  deleteTask,
  fetchGroupMembers,
  fetchEventTypes,
} from '../../lib/api'
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh'
import { InlineLoading } from '../../components/Loading'
import Avatar from '../../components/Avatar'
import AddModal from '../../components/AddModal'
import { formatDateShort, parseDateOnly } from '../../lib/date'
import { CheckIcon, TrashIcon, PlusIcon } from '../../components/icons'

export default function Tasks() {
  const { user } = useAuth()
  const { activeGroupId } = useGroups()
  const { t } = useI18n()

  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [eventTypes, setEventTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  const load = useCallback(async () => {
    if (!activeGroupId) return
    const [taskRes, memberRes, typeRes] = await Promise.all([
      fetchTasks(activeGroupId),
      fetchGroupMembers(activeGroupId),
      fetchEventTypes(activeGroupId),
    ])
    setTasks(taskRes.data || [])
    setMembers(memberRes.data || [])
    setEventTypes(typeRes.data || [])
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

  async function toggle(task) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_complete: !t.is_complete } : t))
    )
    const { error: err } = await setTaskComplete(task.id, !task.is_complete)
    if (err) load()
  }

  async function remove(task) {
    if (!window.confirm(t('tasks.confirmDelete'))) return
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    const { error: err } = await deleteTask(task.id)
    if (err) load()
  }

  return (
    <div className="page stack-3">
      <div className="calendar-head">
        <h1 style={{ margin: 0 }}>{t('tasks.title')}</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>
          <PlusIcon width={20} height={20} /> {t('common.add')}
        </button>
      </div>

      {loading ? (
        <InlineLoading label={t('tasks.loading')} />
      ) : (
        <>
          <section className="stack">
            <h2>{t('tasks.todo')}</h2>
            {open.length === 0 ? (
              <div className="card">
                <p style={{ marginBottom: 0 }}>{t('tasks.allCaughtUp')}</p>
              </div>
            ) : (
              <ul className="task-list">
                {open.map((task) => (
                  <TaskItem key={task.id} task={task} user={user} onToggle={toggle} onDelete={remove} t={t} />
                ))}
              </ul>
            )}
          </section>

          {done.length > 0 && (
            <section className="stack">
              <h2>{t('tasks.done')}</h2>
              <ul className="task-list">
                {done.map((task) => (
                  <TaskItem key={task.id} task={task} user={user} onToggle={toggle} onDelete={remove} t={t} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <AddModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        groupId={activeGroupId}
        userId={user?.id}
        eventTypes={eventTypes}
        members={members}
        memberCount={members.length}
        defaultMode="task"
        onCreated={load}
      />
    </div>
  )
}

function TaskItem({ task, user, onToggle, onDelete, t }) {
  const assigneeName = task.assignee?.display_name || task.assignee?.email
  const isMine = task.assigned_user_id === user?.id
  return (
    <li className={`task-item${task.is_complete ? ' is-done' : ''}`}>
      <button
        className="task-check"
        onClick={() => onToggle(task)}
        aria-pressed={task.is_complete}
        aria-label={task.is_complete ? t('tasks.markNotDone') : t('tasks.markDone')}
      >
        {task.is_complete && <CheckIcon width={22} height={22} />}
      </button>

      <div className="task-body">
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          {task.due_date && (
            <span className="task-date">{formatDateShort(parseDateOnly(task.due_date))}</span>
          )}
          {task.is_shared ? (
            <span className="pill pill-admin task-tag">{t('tasks.shared')}</span>
          ) : (
            <span className="task-assignee">
              <Avatar name={assigneeName} initials={task.assignee?.avatar_initials} size="sm" />
              {isMine ? t('common.you') : assigneeName || t('common.someone')}
            </span>
          )}
        </span>
      </div>

      <button className="icon-btn" onClick={() => onDelete(task)} aria-label={t('tasks.deleteTask')}>
        <TrashIcon />
      </button>
    </li>
  )
}
