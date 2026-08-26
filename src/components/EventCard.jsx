import Avatar from './Avatar'
import { useI18n } from '../context/LanguageContext'
import { formatEventWhen } from '../lib/date'

/** A tappable event summary card (used in the calendar and the day modal). */
export default function EventCard({ ev, attendeeIds = [], memberById, user, onOpen }) {
  const { t } = useI18n()
  const isFull = attendeeIds.length >= ev.capacity
  const mine = attendeeIds.includes(user?.id)
  return (
    <button
      className="card event-card"
      onClick={() => onOpen(ev)}
      style={{ borderLeftColor: ev.type?.color || 'var(--color-border)' }}
    >
      <div className="event-card-top">
        <span className="event-card-time">{formatEventWhen(ev)}</span>
        {ev.type && (
          <span className="type-badge" style={{ backgroundColor: ev.type.color }}>
            {ev.type.name}
          </span>
        )}
      </div>
      {ev.title && <div className="event-card-title">{ev.title}</div>}
      <div className="event-card-bottom">
        <span className={`pill ${isFull ? 'pill-taken' : 'pill-open'}`}>
          {isFull ? t('event.full') : `${attendeeIds.length} / ${ev.capacity}`}
        </span>
        {attendeeIds.length > 0 && (
          <span className="attendee-avatars">
            {attendeeIds.slice(0, 4).map((id) => {
              const m = memberById.get(id)
              return <Avatar key={id} name={m?.name} initials={m?.initials} size="sm" />
            })}
          </span>
        )}
        {mine && <span className="pill pill-admin">{t('event.youreIn')}</span>}
      </div>
    </button>
  )
}
