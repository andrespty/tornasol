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
  isToday,
  formatDayLong,
  formatDateShort,
  formatMonthYear,
  DAY_NAMES_SHORT,
} from '../../lib/date'
import { InlineLoading } from '../../components/Loading'
import AddModal from '../../components/AddModal'
import DayModal from '../../components/DayModal'
import EventDetailModal from '../../components/EventDetailModal'
import { PlusIcon } from '../../components/icons'

export default function Calendar() {
  const { user } = useAuth()
  const { activeGroupId, isAdmin, canCreateEvent } = useGroups()

  const [view, setView] = useState('month')
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))
  const [events, setEvents] = useState([])
  const [members, setMembers] = useState([])
  const [attendees, setAttendees] = useState([])
  const [eventTypes, setEventTypes] = useState([])
  const [loading, setLoading] = useState(true)

  const [dayModalDay, setDayModalDay] = useState(null)
  const [detail, setDetail] = useState(null)
  const [addState, setAddState] = useState(null) // { date }

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
    return map
  }, [events])

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

  function openDay(day) {
    setDayModalDay(startOfDay(day))
  }

  function openEventFromDay(ev) {
    setDayModalDay(null)
    setDetail(ev)
  }

  function addOnDay() {
    const d = dayModalDay
    setDayModalDay(null)
    setAddState({ date: d, taskDue: d })
  }

  const weekStartLabel = startOfWeek(anchor)
  const periodLabel =
    view === 'week'
      ? `${formatDateShort(weekStartLabel)} – ${formatDateShort(addDays(weekStartLabel, 6))}`
      : formatMonthYear(anchor)

  return (
    <div className="page">
      <div className="calendar-head">
        <h1 style={{ margin: 0 }}>Events</h1>
        {canCreateEvent && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setAddState({ date: startOfDay(new Date()), taskDue: null })}
          >
            <PlusIcon width={20} height={20} /> Add
          </button>
        )}
      </div>

      <div className="segmented view-toggle" role="tablist" aria-label="Calendar view">
        <button
          role="tab"
          aria-selected={view === 'month'}
          className={`segmented-btn${view === 'month' ? ' is-active' : ''}`}
          onClick={() => setView('month')}
        >
          Month
        </button>
        <button
          role="tab"
          aria-selected={view === 'week'}
          className={`segmented-btn${view === 'week' ? ' is-active' : ''}`}
          onClick={() => setView('week')}
        >
          Week
        </button>
      </div>

      <div className="period-nav">
        <button className="nav-arrow" onClick={() => shiftPeriod(-1)} aria-label="Previous">
          ‹
        </button>
        <button className="period-label" onClick={() => setAnchor(startOfDay(new Date()))} title="Go to today">
          {periodLabel}
        </button>
        <button className="nav-arrow" onClick={() => shiftPeriod(1)} aria-label="Next">
          ›
        </button>
      </div>

      {loading ? (
        <InlineLoading label="Loading events…" />
      ) : view === 'month' ? (
        <MonthView anchor={anchor} eventsByDay={eventsByDay} onOpenDay={openDay} />
      ) : (
        <WeekView anchor={anchor} eventsByDay={eventsByDay} onOpenDay={openDay} />
      )}

      <DayModal
        open={!!dayModalDay}
        day={dayModalDay}
        onClose={() => setDayModalDay(null)}
        events={events}
        attendeeIdsByEvent={attendeeIdsByEvent}
        memberById={memberById}
        user={user}
        onOpenEvent={openEventFromDay}
        onAdd={addOnDay}
      />

      <AddModal
        open={!!addState}
        onClose={() => setAddState(null)}
        groupId={activeGroupId}
        userId={user?.id}
        eventTypes={eventTypes}
        members={members}
        memberCount={members.length}
        defaultDate={addState?.date}
        taskDueDefault={addState?.taskDue}
        defaultMode="event"
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

function DayDots({ list }) {
  const colors = [...new Set(list.map((e) => e.type?.color).filter(Boolean))].slice(0, 4)
  return (
    <span className="month-dots">
      {colors.map((c) => (
        <span key={c} className="dot" style={{ backgroundColor: c }} />
      ))}
    </span>
  )
}

function MonthView({ anchor, eventsByDay, onOpenDay }) {
  const monthStart = startOfMonth(anchor)
  const gridStart = startOfWeek(monthStart)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))

  return (
    <div className="month-grid" role="grid">
      {DAY_NAMES_SHORT.map((d) => (
        <div key={d} className="month-dow" aria-hidden="true">
          {d}
        </div>
      ))}
      {cells.map((day) => {
        const inMonth = day.getMonth() === monthStart.getMonth()
        const list = eventsByDay.get(startOfDay(day).getTime()) || []
        return (
          <button
            key={day.getTime()}
            className={`month-cell${inMonth ? '' : ' is-out'}${isToday(day) ? ' is-today' : ''}`}
            onClick={() => onOpenDay(day)}
            aria-label={formatDayLong(day)}
          >
            <span className="month-cell-num">{day.getDate()}</span>
            <DayDots list={list} />
          </button>
        )
      })}
    </div>
  )
}

function WeekView({ anchor, eventsByDay, onOpenDay }) {
  const weekStart = startOfWeek(anchor)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  return (
    <div className="week-list">
      {days.map((day) => {
        const list = eventsByDay.get(startOfDay(day).getTime()) || []
        return (
          <button
            key={day.getTime()}
            className={`week-row${isToday(day) ? ' is-today' : ''}`}
            onClick={() => onOpenDay(day)}
          >
            <span className="week-row-date">
              <span className="week-row-dow">
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
              <span className="week-row-num">{day.getDate()}</span>
            </span>
            <span className="week-row-body">
              {list.length === 0 ? (
                <span className="muted">No events</span>
              ) : (
                <span className="week-row-count">
                  {list.length} {list.length === 1 ? 'event' : 'events'}
                </span>
              )}
            </span>
            <DayDots list={list} />
          </button>
        )
      })}
    </div>
  )
}
