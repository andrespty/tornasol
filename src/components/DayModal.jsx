import Modal from './Modal'
import EventCard from './EventCard'
import { startOfDay, formatDayLong } from '../lib/date'
import { PlusIcon } from './icons'

/**
 * Shows every event on a given day with a button to add a new event/task to it.
 * Opened by tapping a day in the calendar.
 */
export default function DayModal({
  open,
  onClose,
  day,
  events,
  attendeeIdsByEvent,
  memberById,
  user,
  onOpenEvent,
  onAdd,
}) {
  if (!day) return null

  const dayKey = startOfDay(day).getTime()
  const list = (events || [])
    .filter((ev) => startOfDay(ev.start_time).getTime() === dayKey)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  return (
    <Modal open={open} onClose={onClose} title={formatDayLong(day)}>
      <div className="stack-3">
        {list.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>Nothing planned for this day yet.</p>
        ) : (
          <div className="stack">
            {list.map((ev) => (
              <EventCard
                key={ev.id}
                ev={ev}
                attendeeIds={attendeeIdsByEvent.get(ev.id) || []}
                memberById={memberById}
                user={user}
                onOpen={onOpenEvent}
              />
            ))}
          </div>
        )}

        <button className="btn btn-primary btn-block btn-lg" onClick={onAdd}>
          <PlusIcon width={20} height={20} /> Add to this day
        </button>
      </div>
    </Modal>
  )
}
