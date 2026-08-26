import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import { useI18n } from '../context/LanguageContext'

const HOURS12 = Array.from({ length: 12 }, (_, i) => i + 1) // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5) // 0,5,...,55
const MERIDIEMS = ['AM', 'PM']

function to12(hour24) {
  const mer = hour24 >= 12 ? 'PM' : 'AM'
  let h = hour24 % 12
  if (h === 0) h = 12
  return { h, mer }
}

function to24(h12, mer) {
  let h = h12 % 12
  if (mer === 'PM') h += 12
  return h
}

export function formatHM(hour, minute) {
  const { h, mer } = to12(hour)
  return `${h}:${String(minute).padStart(2, '0')} ${mer}`
}

function Wheel({ items, value, onChange, format }) {
  const ref = useRef(null)

  // Center the selected item whenever the wheel opens/changes.
  useEffect(() => {
    const el = ref.current?.querySelector('[data-selected="true"]')
    if (el) el.scrollIntoView({ block: 'center' })
  }, [value])

  return (
    <div className="wheel" ref={ref} role="listbox">
      {items.map((it) => (
        <button
          key={it}
          type="button"
          role="option"
          aria-selected={it === value}
          data-selected={it === value}
          className={`wheel-item${it === value ? ' is-selected' : ''}`}
          onClick={() => onChange(it)}
        >
          {format ? format(it) : it}
        </button>
      ))}
    </div>
  )
}

/** Non-native time picker: a button that opens scrollable hour/minute/AM-PM wheels. */
export default function TimeField({ hour, minute, onChange }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [draftH, setDraftH] = useState(to12(hour).h)
  const [draftMin, setDraftMin] = useState(minute)
  const [draftMer, setDraftMer] = useState(to12(hour).mer)

  function openPicker() {
    const t = to12(hour)
    setDraftH(t.h)
    setDraftMin(minute)
    setDraftMer(t.mer)
    setOpen(true)
  }

  function done() {
    onChange(to24(draftH, draftMer), draftMin)
    setOpen(false)
  }

  return (
    <>
      <button type="button" className="select select-sheet-btn" onClick={openPicker}>
        <span className="select-sheet-label">{formatHM(hour, minute)}</span>
        <span className="select-sheet-chevron" aria-hidden="true">▾</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('picker.pickTime')}>
        <div className="stack-3">
          <div className="wheels">
            <Wheel items={HOURS12} value={draftH} onChange={setDraftH} />
            <span className="wheel-sep">:</span>
            <Wheel
              items={MINUTES}
              value={draftMin}
              onChange={setDraftMin}
              format={(m) => String(m).padStart(2, '0')}
            />
            <Wheel items={MERIDIEMS} value={draftMer} onChange={setDraftMer} />
          </div>
          <button type="button" className="btn btn-primary btn-block btn-lg" onClick={done}>
            {t('picker.done')} · {formatHM(to24(draftH, draftMer), draftMin)}
          </button>
        </div>
      </Modal>
    </>
  )
}
