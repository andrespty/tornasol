// Detect Spanish vs English with NO location permission and NO network call:
//  1) the device/browser language (navigator.language)
//  2) the time zone (Intl), mapped to Spanish-speaking countries
// Falls back to English.

const ES_TIMEZONES = new Set([
  // Spain
  'Europe/Madrid', 'Africa/Ceuta', 'Atlantic/Canary',
  // Mexico
  'America/Mexico_City', 'America/Tijuana', 'America/Monterrey', 'America/Merida',
  'America/Cancun', 'America/Chihuahua', 'America/Hermosillo', 'America/Mazatlan',
  'America/Matamoros', 'America/Ojinaga', 'America/Bahia_Banderas',
  // Central America + Caribbean
  'America/Guatemala', 'America/El_Salvador', 'America/Tegucigalpa', 'America/Managua',
  'America/Costa_Rica', 'America/Panama', 'America/Havana', 'America/Santo_Domingo',
  'America/Puerto_Rico',
  // South America
  'America/Bogota', 'America/Caracas', 'America/Guayaquil', 'Pacific/Galapagos',
  'America/Lima', 'America/La_Paz', 'America/Asuncion', 'America/Santiago',
  'America/Punta_Arenas', 'Pacific/Easter', 'America/Montevideo',
  // Equatorial Guinea
  'Africa/Malabo',
])

export function detectLang() {
  try {
    const nav =
      (navigator.languages && navigator.languages[0]) || navigator.language || ''
    if (nav.toLowerCase().startsWith('es')) return 'es'

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    if (tz.startsWith('America/Argentina/')) return 'es'
    if (ES_TIMEZONES.has(tz)) return 'es'
  } catch {
    // ignore — fall through to English
  }
  return 'en'
}
