/**
 * Small, dependency-free date helpers for the shift calendar.
 * All times are stored as ISO/timestamptz in Supabase and rendered in the
 * user's local timezone.
 */

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// Week starts on Sunday to match most family calendars.
export function startOfWeek(date) {
  const d = startOfDay(date)
  return addDays(d, -d.getDay())
}

export function startOfMonth(date) {
  const d = startOfDay(date)
  d.setDate(1)
  return d
}

export function endOfMonth(date) {
  const d = startOfMonth(date)
  d.setMonth(d.getMonth() + 1)
  return addDays(d, -1)
}

export function sameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

export function isToday(date) {
  return sameDay(date, new Date())
}

export function formatDayLong(date) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateShort(date) {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatTimeRange(start, end) {
  return `${formatTime(start)} – ${formatTime(end)}`
}

export function formatMonthYear(date) {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

// yyyy-mm-ddThh:mm for <input type="datetime-local"> using LOCAL time.
export function toLocalInputValue(date) {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

/**
 * Expand a shift with a weekly recurrence rule into concrete occurrences
 * within [rangeStart, rangeEnd]. We keep the rule format tiny and readable:
 *   "WEEKLY;COUNT=8"  → repeats weekly for 8 weeks from the shift's start.
 * A shift with no recurrence_rule simply returns itself if it lands in range.
 */
export function expandShiftOccurrences(shift, rangeStart, rangeEnd) {
  const start = new Date(shift.start_time)
  const end = new Date(shift.end_time)
  const durationMs = end.getTime() - start.getTime()

  const inRange = (s) => s.getTime() >= rangeStart.getTime() && s.getTime() <= rangeEnd.getTime()

  if (!shift.recurrence_rule) {
    return inRange(start)
      ? [{ ...shift, occurrence_start: start, occurrence_end: end, is_recurring: false }]
      : []
  }

  const rule = parseRecurrence(shift.recurrence_rule)
  const occurrences = []
  const maxCount = rule.count || 52
  let cursor = new Date(start)

  for (let i = 0; i < maxCount; i += 1) {
    if (cursor.getTime() > rangeEnd.getTime()) break
    if (inRange(cursor)) {
      occurrences.push({
        ...shift,
        occurrence_start: new Date(cursor),
        occurrence_end: new Date(cursor.getTime() + durationMs),
        is_recurring: true,
      })
    }
    cursor = addDays(cursor, 7) // weekly only for v1
  }

  return occurrences
}

export function parseRecurrence(rule) {
  const parts = String(rule).split(';')
  const out = { freq: 'WEEKLY', count: null }
  parts.forEach((p) => {
    const [k, v] = p.split('=')
    if (k === 'COUNT') out.count = parseInt(v, 10) || null
    if (!v && k) out.freq = k
  })
  return out
}

export function buildWeeklyRule(count) {
  const n = Math.max(1, Math.min(52, parseInt(count, 10) || 1))
  return `WEEKLY;COUNT=${n}`
}
