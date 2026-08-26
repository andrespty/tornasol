import Modal from './Modal'
import EventCard from './EventCard'
import Avatar from './Avatar'
import { startOfDay, sameDay, formatDayLong, parseDateOnly } from '../lib/date'
import { PlusIcon, CheckIcon } from './icons'

function TaskRow({ task, user, onToggle }) {
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
    </li>
  )
}

/**
 * Everything on a given day — events and dated tasks — with a button to add
 * more. Opened by tapping a day in the calendar.
 */
export default function DayModal({
  open,
  onClose,
  day,
  events,
  tasks,
  attendeeIdsByEvent,
  memberById,
  user,
  onOpenEvent,
  onToggleTask,
  onAdd,
}) {
  if (!day) return null

  const dayKey = startOfDay(day).getTime()
  const events_ = (events || [])
    .filter((ev) => startOfDay(ev.start_time).getTime() === dayKey)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  const tasks_ = (tasks || []).filter(
    (t) => t.due_date && sameDay(parseDateOnly(t.due_date), day)
  )

  const empty = events_.length === 0 && tasks_.length === 0

  return (
    <Modal open={open} onClose={onClose} title={formatDayLong(day)}>
      <div className="stack-3">
        {empty && <p className="muted" style={{ margin: 0 }}>Nothing planned for this day yet.</p>}

        {events_.length > 0 && (
          <section className="stack">
            <h3 style={{ marginBottom: 0 }}>Events</h3>
            {events_.map((ev) => (
              <EventCard
                key={ev.id}
                ev={ev}
                attendeeIds={attendeeIdsByEvent.get(ev.id) || []}
                memberById={memberById}
                user={user}
                onOpen={onOpenEvent}
              />
            ))}
          </section>
        )}

        {tasks_.length > 0 && (
          <section className="stack">
            <h3 style={{ marginBottom: 0 }}>Tasks</h3>
            <ul className="task-list">
              {tasks_.map((t) => (
                <TaskRow key={t.id} task={t} user={user} onToggle={onToggleTask} />
              ))}
            </ul>
          </section>
        )}

        <button className="btn btn-primary btn-block btn-lg" onClick={onAdd}>
          <PlusIcon width={20} height={20} /> Add to this day
        </button>
      </div>
    </Modal>
  )
}
