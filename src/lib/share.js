/**
 * Share helpers for pushing Tornasol updates into WhatsApp.
 *
 * WhatsApp can't be posted to a group programmatically, so we open WhatsApp
 * with a pre-filled message and let the person pick their family group and
 * hit send. https://wa.me/?text= opens WhatsApp directly (app on mobile,
 * WhatsApp Web on desktop) with the text ready.
 */
export function openWhatsApp(text) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener')
}

// A single event, framed to get people to sign up.
export function buildEventShareText({ typeName, title, dayLine, whenLine, signedUp, capacity, url }) {
  const spotsLeft = Math.max(0, capacity - signedUp)
  const heading = title ? `${typeName} — ${title}` : typeName
  const status =
    spotsLeft === 0
      ? `Full (${signedUp}/${capacity})`
      : `${signedUp}/${capacity} signed up · ${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} open`

  return (
    `🌻 *${heading}*\n` +
    `${dayLine}, ${whenLine}\n` +
    `${status}\n\n` +
    `Sign up 👉 ${url}`
  )
}

// The whole week's schedule as a digest.
export function buildWeekShareText({ groupName, rangeLabel, sections, url }) {
  const body =
    sections.length === 0
      ? 'No events scheduled this week yet.'
      : sections
          .map((s) => `*${s.dayLabel}*\n${s.entries.map((e) => `• ${e}`).join('\n')}`)
          .join('\n\n')

  return (
    `🌻 *This week — ${groupName}*\n` +
    `${rangeLabel}\n\n` +
    `${body}\n\n` +
    `Open in Tornasol 👉 ${url}`
  )
}
