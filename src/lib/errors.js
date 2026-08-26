/**
 * Translate technical Supabase/Postgres errors into plain, warm language.
 * Users of Tornasol should never see a raw error string.
 *
 * Reads the chosen language from localStorage so callers don't need to pass it.
 */
function currentLang() {
  try {
    const l = window.localStorage.getItem('tornasol-lang')
    if (l === 'es' || l === 'en') return l
  } catch {
    // ignore
  }
  return (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en'
}

const MESSAGES = {
  invalidCredentials: {
    en: 'That email or password does not match. Please check and try again.',
    es: 'Ese correo o contraseña no coincide. Revísalo e inténtalo de nuevo.',
  },
  emailNotConfirmed: {
    en: 'Please confirm your email first — check your inbox for a link.',
    es: 'Primero confirma tu correo — busca el enlace en tu bandeja de entrada.',
  },
  alreadyRegistered: {
    en: 'There is already an account with this email. Try logging in instead.',
    es: 'Ya existe una cuenta con este correo. Mejor inicia sesión.',
  },
  weakPassword: {
    en: 'Please choose a password with at least 6 characters.',
    es: 'Elige una contraseña de al menos 6 caracteres.',
  },
  invalidEmail: {
    en: 'That email address does not look right. Please check it.',
    es: 'Ese correo no parece válido. Por favor revísalo.',
  },
  rateLimit: {
    en: 'Too many tries just now. Please wait a moment and try again.',
    es: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  },
  network: {
    en: 'We could not reach the internet. Please check your connection.',
    es: 'No pudimos conectarnos. Revisa tu conexión a internet.',
  },
  generic: {
    en: 'Something went wrong. Please try again.',
    es: 'Algo salió mal. Por favor inténtalo de nuevo.',
  },
}

export function friendlyError(error) {
  const lang = currentLang()
  const pick = (key) => MESSAGES[key][lang] || MESSAGES[key].en

  if (!error) return pick('generic')
  const message = (error.message || String(error)).toLowerCase()

  if (message.includes('invalid login credentials')) return pick('invalidCredentials')
  if (message.includes('email not confirmed')) return pick('emailNotConfirmed')
  if (message.includes('user already registered') || message.includes('already been registered'))
    return pick('alreadyRegistered')
  if (message.includes('password should be at least')) return pick('weakPassword')
  if (message.includes('unable to validate email') || message.includes('invalid email'))
    return pick('invalidEmail')
  if (message.includes('rate limit') || message.includes('too many requests')) return pick('rateLimit')
  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('load failed')
  )
    return pick('network')
  if (message.includes('not configured')) return error.message

  return pick('generic')
}
