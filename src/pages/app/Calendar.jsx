import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGroups } from '../../context/GroupContext'
import { fetchEvents, fetchGroupMembers, fetchAttendeesForGroup, fetchEventTypes } from '../../lib/api'
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh'
import {
  startOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  addDays,
  sameDay,
  isToday,
  formatDayLong,
  formatDateShort,
  formatMonthYear,
  formatTimeRange,
  DAY_NAMES_SHORT,
} from '../../lib/date'
import { InlineLoading } from '../../components/Loading'
import Avatar from '../../components/Avatar'
import CreateEventModal from '../../components/CreateEventModal'
import EventDetailModal from '../../components/EventDetailModal'
import { PlusIcon } from '../../components/icons'

export default function Calendar() {
  const { user } = useAuth()
  const { activeGroupId, isAdmin, canCreateEvent } = useGroups()

  const [view, setView] = useState('week')
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()))
  const [events, setEvents] = useState([])
  const [members, setMembers] = useState([])
  const [attendees, setAttendees] = useState([])
  const [eventTypes, setEventTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    if (!activeGroupId) return
    const [evRes, memRes, attRes, typeRes] = await Promise.all([
      fetchEvents(activeGroupId),
      fetchGroupMembers(activeGroupId),
      fetchAttendeesForGroup(activeGroupId),
      fetchEventTypes(activeGroupId),
    ])
    setEvents(evRes.data || [])
    setMembers(memRes.data || [])
    setAttendees(attRes.data || [])
    setEventTypes(typeRes.data || [])
    setLoading(false)
  }, [activeGroupId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useRealtimeRefresh(
    'events',
    { filter: `group_id=eq.${activeGroupId}`, channelKey: `events-${activeGroupId}`, enabled: !!activeGroupId },
    load
  )
  useRealtimeRefresh(
    'event_attendees',
    { channelKey: `attendees-${activeGroupId}`, enabled: !!activeGroupId },
    load
  )

  const memberById = useMemo(() => {
    const map = new Map()
    members.forEach((m) => map.set(m.userId, m))
    return map
  }, [members])

  const attendeeIdsByEvent = useMemo(() => {
    const map = new Map()
    attendees.forEach((a) => {
      if (!map.has(a.event_id)) map.set(a.event_id, [])
      map.get(a.event_id).push(a.user_id)
    })
    return map
  }, [attendees])

  const eventsByDay = useMemo(() => {
    const map = new Map()
    events.forEach((ev) => {
      const key = startOfDay(ev.start_time).getTime()
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(ev)
    })
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    }
    return map
  }, [events])

  // Keep the open detail modal's data fresh after a reload.
  const detailLive = useMemo(
    () => (detail ? events.find((e) => e.id === detail.id) || null : null),
    [detail, events]
  )

  function shiftPeriod(dir) {
    if (view === 'week') {
      setAnchor((a) => addDays(a, dir * 7))
    } else {
      setAnchor((a) => {
        const d = new Date(a)
        d.setMonth(d.getMonth() + dir)
        return startOfDay(d)
      })
    }
  }

  function goToday() {
    const t = startOfDay(new Date())
    setAnchor(t)
    setSelectedDay(t)
  }

  const weekStartLabel = startOfWeek(anchor)
  const periodLabel =
    view === 'week'
      ? `${formatDateShort(weekStartLabel)} – ${formatDateShort(addDays(weekStartLabel, 6))}`
      : formatMonthYear(anchor)

  const shared = { attendeeIdsByEvent, memberById, user, onOpen: setDetail }

  return (
    <div className="page">
      <div className="calendar-head">
        <h1 style={{ margin: 0 }}>Events</h1>
        {canCreateEvent && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <PlusIcon width={20} height={20} /> Add
          </button>
        )}
      </div>

      <div className="segmented view-toggle" role="tablist" aria-label="Calendar view">
        <button
          role="tab"
          aria-selected={view === 'week'}
          className={`segmented-btn${view === 'week' ? ' is-active' : ''}`}
          onClick={() => setView('week')}
        >
          Week
        </button>
        <button
          role="tab"
          aria-selected={view === 'month'}
          className={`segmented-btn${view === 'month' ? ' is-active' : ''}`}
          onClick={() => setView('month')}
        >
          Month
        </button>
      </div>

      <div className="period-nav">
        <button className="nav-arrow" onClick={() => shiftPeriod(-1)} aria-label="Previous">
          ‹
        </button>
        <button className="period-label" onClick={goToday} title="Go to today">
          {periodLabel}
        </button>
        <button className="nav-arrow" onClick={() => shiftPeriod(1)} aria-label="Next">
          ›
        </button>
      </div>

      {loading ? (
        <InlineLoading label="Loading events…" />
      ) : view === 'week' ? (
        <WeekView anchor={anchor} eventsByDay={eventsByDay} {...shared} />
      ) : (
        <MonthView
          anchor={anchor}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          eventsByDay={eventsByDay}
          {...shared}
        />
      )}

      <CreateEventModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        groupId={activeGroupId}
        userId={user?.id}
        eventTypes={eventTypes}
        memberCount={members.length}
        defaultDate={selectedDay}
        onCreated={load}
      />

      <EventDetailModal
        open={!!detailLive}
        event={detailLive}
        attendeeIds={detailLive ? attendeeIdsByEvent.get(detailLive.id) || [] : []}
        onClose={() => setDetail(null)}
        memberById={memberById}
        members={members}
        user={user}
        isAdmin={isAdmin}
        onChanged={load}
      />
    </div>
  )
}

function EventCard({ ev, attendeeIdsByEvent, memberById, user, onOpen }) {
  const ids = attendeeIdsByEvent.get(ev.id) || []
  const isFull = ids.length >= ev.capacity
  const mine = ids.includes(user?.id)
  return (
    <button
      className="card event-card"
      onClick={() => onOpen(ev)}
      style={{ borderLeftColor: ev.type?.color || 'var(--color-border)' }}
    >
      <div className="event-card-top">
        <span className="event-card-time">{formatTimeRange(ev.start_time, ev.end_time)}</span>
        {ev.type && (
          <span className="type-badge" style={{ backgroundColor: ev.type.color }}>
            {ev.type.name}
          </span>
        )}
      </div>
      <div className="event-card-bottom">
        <span className={`pill ${isFull ? 'pill-taken' : 'pill-open'}`}>
          {isFull ? 'Full' : `${ids.length} / ${ev.capacity}`}
        </span>
        {ids.length > 0 && (
          <span className="attendee-avatars">
            {ids.slice(0, 4).map((id) => {
              const m = memberById.get(id)
              return <Avatar key={id} name={m?.name} initials={m?.initials} size="sm" />
            })}
          </span>
        )}
        {mine && <span className="pill pill-admin">You're in</span>}
      </div>
    </button>
  )
}

function WeekView({ anchor, eventsByDay, ...shared }) {
  const weekStart = startOfWeek(anchor)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  return (
    <div className="stack-3">
      {days.map((day) => {
        const list = eventsByDay.get(startOfDay(day).getTime()) || []
        return (
          <section key={day.getTime()} className={`day-block${isToday(day) ? ' is-today' : ''}`}>
            <h2 className="day-heading">
              {formatDayLong(day)}
              {isToday(day) && <span className="today-tag">Today</span>}
            </h2>
            {list.length === 0 ? (
              <p className="muted no-shifts">No events</p>
            ) : (
              <div className="stack">
                {list.map((ev) => (
                  <EventCard key={ev.id} ev={ev} {...shared} />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function MonthView({ anchor, selectedDay, setSelectedDay, eventsByDay, ...shared }) {
  const monthStart = startOfMonth(anchor)
  const gridStart = startOfWeek(monthStart)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const selectedList = eventsByDay.get(startOfDay(selectedDay).getTime()) || []

  return (
    <div className="stack-3">
      <div className="month-grid" role="grid">
        {DAY_NAMES_SHORT.map((d) => (
          <div key={d} className="month-dow" aria-hidden="true">
            {d}
          </div>
        ))}
        {cells.map((day) => {
          const inMonth = day.getMonth() === monthStart.getMonth()
          const list = eventsByDay.get(startOfDay(day).getTime()) || []
          const isSel = sameDay(day, selectedDay)
          const dotColors = [...new Set(list.map((e) => e.type?.color).filter(Boolean))].slice(0, 3)
          return (
            <button
              key={day.getTime()}
              className={`month-cell${inMonth ? '' : ' is-out'}${isSel ? ' is-selected' : ''}${
                isToday(day) ? ' is-today' : ''
              }`}
              onClick={() => setSelectedDay(startOfDay(day))}
              aria-label={formatDayLong(day)}
              aria-pressed={isSel}
            >
              <span className="month-cell-num">{day.getDate()}</span>
              <span className="month-dots">
                {dotColors.map((c) => (
                  <span key={c} className="dot" style={{ backgroundColor: c }} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <section className="day-block">
        <h2 className="day-heading">{formatDayLong(selectedDay)}</h2>
        {selectedList.length === 0 ? (
          <p className="muted no-shifts">No events this day</p>
        ) : (
          <div className="stack">
            {selectedList.map((ev) => (
              <EventCard key={ev.id} ev={ev} {...shared} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
