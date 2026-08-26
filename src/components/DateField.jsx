import { useState } from 'react'
import Modal from './Modal'
import {
  startOfDay,
  startOfMonth,
  startOfWeek,
  addDays,
  sameDay,
  isToday,
  formatDayLong,
  formatMonthYear,
  DAY_NAMES_SHORT,
} from '../lib/date'

/** Non-native date picker: a button that opens a tappable month calendar.
 *  When `clearable`, the value may be null and the sheet offers "No due date". */
export default function DateField({
  value,
  onChange,
  placeholder = 'Pick a day',
  clearable = false,
}) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState(() => startOfMonth(value || new Date()))

  const monthStart = startOfMonth(anchor)
  const gridStart = startOfWeek(monthStart)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))

  function move(dir) {
    const d = new Date(anchor)
    d.setMonth(d.getMonth() + dir)
    setAnchor(startOfMonth(d))
  }

  return (
    <>
      <button type="button" className="select select-sheet-btn" onClick={() => setOpen(true)}>
        <span className="select-sheet-label">{value ? formatDayLong(value) : placeholder}</span>
        <span className="select-sheet-chevron" aria-hidden="true">▾</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Pick a day">
        <div className="stack-3">
          {clearable && (
            <button
              type="button"
              className={`sheet-item${!value ? ' is-active' : ''}`}
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
            >
              <span className="sheet-item-label">No due date</span>
            </button>
          )}
          <div className="period-nav">
            <button className="nav-arrow" onClick={() => move(-1)} aria-label="Previous month">
              ‹
            </button>
            <span className="period-label" style={{ cursor: 'default' }}>
              {formatMonthYear(anchor)}
            </span>
            <button className="nav-arrow" onClick={() => move(1)} aria-label="Next month">
              ›
            </button>
          </div>

          <div className="month-grid" role="grid">
            {DAY_NAMES_SHORT.map((d) => (
              <div key={d} className="month-dow" aria-hidden="true">
                {d}
              </div>
            ))}
            {cells.map((day) => {
              const inMonth = day.getMonth() === monthStart.getMonth()
              const isSel = value && sameDay(day, value)
              return (
                <button
                  key={day.getTime()}
                  className={`month-cell${inMonth ? '' : ' is-out'}${isSel ? ' is-selected' : ''}${
                    isToday(day) ? ' is-today' : ''
                  }`}
                  onClick={() => {
                    onChange(startOfDay(day))
                    setOpen(false)
                  }}
                  aria-label={formatDayLong(day)}
                >
                  <span className="month-cell-num">{day.getDate()}</span>
                </button>
              )
            })}
          </div>
        </div>
      </Modal>
    </>
  )
}
