/**
 * Share helpers for pushing Tornasol updates into WhatsApp.
 *
 * WhatsApp can't be posted to a group programmatically, so we open WhatsApp
 * with a pre-filled message and let the person pick their family group and
 * hit send. https://wa.me/?text= opens WhatsApp directly (app on mobile,
 * WhatsApp Web on desktop) with the text ready.
 */
import {
  startOfWeek,
  startOfDay,
  addDays,
  formatDateShort,
  formatEventWhen,
  toDateOnly,
  DAY_NAMES_SHORT,
} from './date'

export function openWhatsApp(text) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener')
}

// Read the chosen language (same source as the rest of the app) so shared
// messages match the sender's language without needing React context.
function shareLang() {
  try {
    const l = window.localStorage.getItem('tornasol-lang')
    if (l === 'es' || l === 'en') return l
  } catch {
    // ignore
  }
  return (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en'
}

const M = {
  full: {
    en: (n, cap) => `Full (${n}/${cap})`,
    es: (n, cap) => `Lleno (${n}/${cap})`,
  },
  status: {
    en: (n, cap, left) => `${n}/${cap} signed up · ${left} ${left === 1 ? 'spot' : 'spots'} open`,
    es: (n, cap, left) => `${n}/${cap} apuntados · ${left} ${left === 1 ? 'lugar' : 'lugares'} libre${left === 1 ? '' : 's'}`,
  },
  signUp: { en: 'Sign up 👉', es: 'Apúntate 👉' },
  thisWeek: { en: 'This week', es: 'Esta semana' },
  noEvents: { en: 'No events scheduled this week yet.', es: 'Aún no hay eventos esta semana.' },
  openIn: { en: 'Open in Tornasol 👉', es: 'Abre en Tornasol 👉' },
}

// A single event, framed to get people to sign up.
export function buildEventShareText({ typeName, title, dayLine, whenLine, signedUp, capacity, url }) {
  const lang = shareLang()
  const spotsLeft = Math.max(0, capacity - signedUp)
  const heading = title ? `${typeName} — ${title}` : typeName
  const status =
    spotsLeft === 0
      ? M.full[lang](signedUp, capacity)
      : M.status[lang](signedUp, capacity, spotsLeft)

  return (
    `🌻 *${heading}*\n` +
    `${dayLine}, ${whenLine}\n` +
    `${status}\n\n` +
    `${M.signUp[lang]} ${url}`
  )
}

// Build + open a WhatsApp digest of a week's events. Defaults to this week.
export function shareWeekOnWhatsApp({ events, attendeeCountByEvent, groupName, origin, weekStart }) {
  const ws = weekStart || startOfWeek(new Date())
  const sections = []
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(ws, i)
    const dayKey = startOfDay(day).getTime()
    const list = (events || [])
      .filter((ev) => startOfDay(ev.start_time).getTime() === dayKey)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    if (list.length === 0) continue
    sections.push({
      dayLabel: `${DAY_NAMES_SHORT[day.getDay()]}, ${formatDateShort(day)}`,
      entries: list.map((ev) => {
        const signed = attendeeCountByEvent?.get(ev.id) || 0
        const name = ev.title ? `${ev.type?.name || 'Event'}: ${ev.title}` : ev.type?.name || 'Event'
        return `${formatEventWhen(ev)} — ${name} (${signed}/${ev.capacity})`
      }),
    })
  }
  const url = `${origin}/app/calendar?week=${toDateOnly(ws)}`
  openWhatsApp(
    buildWeekShareText({
      groupName,
      rangeLabel: `${formatDateShort(ws)} – ${formatDateShort(addDays(ws, 6))}`,
      sections,
      url,
    })
  )
}

// The whole week's schedule as a digest.
export function buildWeekShareText({ groupName, rangeLabel, sections, url }) {
  const lang = shareLang()
  const body =
    sections.length === 0
      ? M.noEvents[lang]
      : sections
          .map((s) => `*${s.dayLabel}*\n${s.entries.map((e) => `• ${e}`).join('\n')}`)
          .join('\n\n')

  return (
    `🌻 *${M.thisWeek[lang]} — ${groupName}*\n` +
    `${rangeLabel}\n\n` +
    `${body}\n\n` +
    `${M.openIn[lang]} ${url}`
  )
}
