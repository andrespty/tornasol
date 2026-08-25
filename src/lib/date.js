/**
 * Small, dependency-free date helpers for the event calendar.
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

// "All day" for all-day events, otherwise the time range.
export function formatEventWhen(ev) {
  if (ev?.all_day) return 'All day'
  return formatTimeRange(ev.start_time, ev.end_time)
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
