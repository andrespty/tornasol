export default function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="spinner" />
      <p className="muted">{label}</p>
    </div>
  )
}

export function InlineLoading({ label = 'Loading…' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        color: 'var(--color-text-secondary)',
        padding: 'var(--space-3) 0',
      }}
    >
      <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
      <span>{label}</span>
    </div>
  )
}
