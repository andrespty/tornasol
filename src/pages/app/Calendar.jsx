import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGroups } from '../../context/GroupContext'
import { fetchShifts, fetchGroupMembers } from '../../lib/api'
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
  expandShiftOccurrences,
} from '../../lib/date'
import { InlineLoading } from '../../components/Loading'
import Avatar from '../../components/Avatar'
import CreateShiftModal from '../../components/CreateShiftModal'
import ShiftDetailModal from '../../components/ShiftDetailModal'
import CreateGroupCard from '../../components/CreateGroupCard'
import { PlusIcon } from '../../components/icons'

export default function Calendar() {
  const { user } = useAuth()
  const { activeGroupId, isAdmin, canCreateShift, hasNoGroups } = useGroups()

  const [view, setView] = useState('week') // 'week' | 'month'
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()))
  const [shifts, setShifts] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    if (!activeGroupId) return
    const [shiftRes, memberRes] = await Promise.all([
      fetchShifts(activeGroupId),
      fetchGroupMembers(activeGroupId),
    ])
    setShifts(shiftRes.data || [])
    setMembers(memberRes.data || [])
    setLoading(false)
  }, [activeGroupId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  // Live updates when anyone claims/releases/creates a shift.
  useRealtimeRefresh(
    'shifts',
    { filter: `group_id=eq.${activeGroupId}`, channelKey: `shifts-${activeGroupId}`, enabled: !!activeGroupId },
    load
  )

  const memberById = useMemo(() => {
    const map = new Map()
    members.forEach((m) => map.set(m.userId, m))
    return map
  }, [members])

  // All occurrences within a padded range (so recurring shifts appear).
  const occurrences = useMemo(() => {
    const rangeStart = view === 'week' ? startOfWeek(anchor) : startOfMonth(anchor)
    const rangeEnd = view === 'week' ? addDays(rangeStart, 6) : endOfMonth(anchor)
    // include end-of-day for the last day
    const paddedEnd = addDays(startOfDay(rangeEnd), 1)
    const list = []
    shifts.forEach((s) => {
      expandShiftOccurrences(s, rangeStart, paddedEnd).forEach((occ) => list.push(occ))
    })
    return list.sort((a, b) => a.occurrence_start - b.occurrence_start)
  }, [shifts, view, anchor])

  const occurrencesByDay = useMemo(() => {
    const map = new Map()
    occurrences.forEach((occ) => {
      const key = startOfDay(occ.occurrence_start).getTime()
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(occ)
    })
    return map
  }, [occurrences])

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

  if (hasNoGroups) {
    return (
      <div className="page stack-3">
        <h1>Shifts</h1>
        <p className="muted">Create a care team first to start scheduling shifts.</p>
        <CreateGroupCard />
      </div>
    )
  }

  const weekStartLabel = startOfWeek(anchor)
  const periodLabel =
    view === 'week'
      ? `${formatDateShort(weekStartLabel)} – ${formatDateShort(addDays(weekStartLabel, 6))}`
      : formatMonthYear(anchor)

  return (
    <div className="page">
      <div className="calendar-head">
        <h1 style={{ margin: 0 }}>Shifts</h1>
        {canCreateShift && (
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
          {view === 'month' ? formatMonthYear(anchor) : periodLabel}
        </button>
        <button className="nav-arrow" onClick={() => shiftPeriod(1)} aria-label="Next">
          ›
        </button>
      </div>

      {loading ? (
        <InlineLoading label="Loading shifts…" />
      ) : view === 'week' ? (
        <WeekView
          anchor={anchor}
          occurrencesByDay={occurrencesByDay}
          memberById={memberById}
          user={user}
          onOpen={setDetail}
        />
      ) : (
        <MonthView
          anchor={anchor}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          occurrencesByDay={occurrencesByDay}
          memberById={memberById}
          user={user}
          onOpen={setDetail}
        />
      )}

      <CreateShiftModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        groupId={activeGroupId}
        userId={user?.id}
        defaultDate={selectedDay}
        onCreated={load}
      />

      <ShiftDetailModal
        open={!!detail}
        occurrence={detail}
        onClose={() => setDetail(null)}
        memberById={memberById}
        user={user}
        isAdmin={isAdmin}
        onChanged={load}
      />
    </div>
  )
}

function ShiftCard({ occ, memberById, user, onOpen }) {
  const assignee = occ.assigned_user_id ? memberById.get(occ.assigned_user_id) : null
  const isMine = occ.assigned_user_id === user?.id
  return (
    <button
      className="card shift-card"
      onClick={() => onOpen(occ)}
      aria-label={`Shift ${formatTimeRange(occ.occurrence_start, occ.occurrence_end)}`}
    >
      <div className="shift-card-time">
        {formatTimeRange(occ.occurrence_start, occ.occurrence_end)}
        {occ.is_recurring && <span className="pill pill-admin repeat-pill">weekly</span>}
      </div>
      {assignee ? (
        <div className="shift-assignee">
          <Avatar name={assignee.name} initials={assignee.initials} size="sm" />
          <span>{isMine ? 'You' : assignee.name}</span>
        </div>
      ) : (
        <span className="pill pill-open">Open — tap to take</span>
      )}
    </button>
  )
}

function WeekView({ anchor, occurrencesByDay, memberById, user, onOpen }) {
  const weekStart = startOfWeek(anchor)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  return (
    <div className="stack-3">
      {days.map((day) => {
        const list = occurrencesByDay.get(startOfDay(day).getTime()) || []
        return (
          <section key={day.getTime()} className={`day-block${isToday(day) ? ' is-today' : ''}`}>
            <h2 className="day-heading">
              {formatDayLong(day)}
              {isToday(day) && <span className="today-tag">Today</span>}
            </h2>
            {list.length === 0 ? (
              <p className="muted no-shifts">No shifts</p>
            ) : (
              <div className="stack">
                {list.map((occ, i) => (
                  <ShiftCard
                    key={`${occ.id}-${i}`}
                    occ={occ}
                    memberById={memberById}
                    user={user}
                    onOpen={onOpen}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function MonthView({ anchor, selectedDay, setSelectedDay, occurrencesByDay, memberById, user, onOpen }) {
  const monthStart = startOfMonth(anchor)
  const gridStart = startOfWeek(monthStart)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const selectedList = occurrencesByDay.get(startOfDay(selectedDay).getTime()) || []

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
          const list = occurrencesByDay.get(startOfDay(day).getTime()) || []
          const hasOpen = list.some((o) => !o.assigned_user_id)
          const hasTaken = list.some((o) => o.assigned_user_id)
          const isSel = sameDay(day, selectedDay)
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
                {hasOpen && <span className="dot dot-open" />}
                {hasTaken && <span className="dot dot-taken" />}
              </span>
            </button>
          )
        })}
      </div>

      <section className="day-block">
        <h2 className="day-heading">{formatDayLong(selectedDay)}</h2>
        {selectedList.length === 0 ? (
          <p className="muted no-shifts">No shifts this day</p>
        ) : (
          <div className="stack">
            {selectedList.map((occ, i) => (
              <ShiftCard
                key={`${occ.id}-${i}`}
                occ={occ}
                memberById={memberById}
                user={user}
                onOpen={onOpen}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
