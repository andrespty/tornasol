import { useState } from 'react'
import Modal from './Modal'
import Avatar from './Avatar'
import { CheckIcon } from './icons'

/**
 * A non-native single-select: a big button that opens a bottom-sheet list of
 * options with large tap targets. Warmer and more legible than an OS dropdown.
 *
 * options: [{ value, label, initials? }]. When `initials` is provided (even
 * null), an avatar is shown for that option.
 */
export default function SelectSheet({
  value,
  onChange,
  options,
  placeholder = 'Choose…',
  title = 'Choose',
  hasAvatars = false,
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <>
      <button
        type="button"
        className="select select-sheet-btn"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span className="select-sheet-value">
          {hasAvatars && selected && selected.value !== '' && (
            <Avatar name={selected.label} initials={selected.initials} size="sm" />
          )}
          <span className="select-sheet-label">{selected ? selected.label : placeholder}</span>
        </span>
        <span className="select-sheet-chevron" aria-hidden="true">▾</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <ul className="sheet-list">
          {options.map((o) => (
            <li key={o.value || 'none'}>
              <button
                type="button"
                className={`sheet-item${o.value === value ? ' is-active' : ''}`}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
              >
                {hasAvatars && o.value !== '' && (
                  <Avatar name={o.label} initials={o.initials} size="sm" />
                )}
                <span className="sheet-item-label">{o.label}</span>
                {o.value === value && <CheckIcon width={22} height={22} />}
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  )
}
