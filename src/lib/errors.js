/**
 * Translate technical Supabase/Postgres errors into plain, warm language.
 * Users of Tornasol should never see a raw error string.
 */
export function friendlyError(error) {
  if (!error) return 'Something went wrong. Please try again.'

  const message = (error.message || String(error)).toLowerCase()

  if (message.includes('invalid login credentials')) {
    return 'That email or password does not match. Please check and try again.'
  }
  if (message.includes('email not confirmed')) {
    return 'Please confirm your email first — check your inbox for a link.'
  }
  if (message.includes('user already registered') || message.includes('already been registered')) {
    return 'There is already an account with this email. Try logging in instead.'
  }
  if (message.includes('password should be at least')) {
    return 'Please choose a password with at least 6 characters.'
  }
  if (message.includes('unable to validate email') || message.includes('invalid email')) {
    return 'That email address does not look right. Please check it.'
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many tries just now. Please wait a moment and try again.'
  }
  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('load failed')
  ) {
    return 'We could not reach the internet. Please check your connection.'
  }
  if (message.includes('not configured')) {
    return error.message
  }

  // Fall back to a gentle generic message, never the raw technical text.
  return 'Something went wrong. Please try again.'
}
