/**
 * Initials avatar on a soft-peach background (design system requirement).
 * Never requires a profile photo for v1.
 */
export function initialsFor(nameOrEmail) {
  if (!nameOrEmail) return '?'
  const trimmed = String(nameOrEmail).trim()
  if (trimmed.includes('@') && !trimmed.includes(' ')) {
    return trimmed.slice(0, 2).toUpperCase()
  }
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Avatar({ name, initials, size = 'md', title }) {
  const label = initials || initialsFor(name)
  const cls = size === 'lg' ? 'avatar avatar-lg' : size === 'sm' ? 'avatar avatar-sm' : 'avatar'
  return (
    <span className={cls} title={title || name} aria-hidden={!title && !name}>
      {label}
    </span>
  )
}
