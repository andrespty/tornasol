import { useEffect, useState } from 'react'
import Modal from './Modal'
import SelectSheet from './SelectSheet'
import DateField from './DateField'
import TimeField from './TimeField'
import Stepper from './Stepper'
import { createEvents } from '../lib/api'
import { addDays, startOfDay } from '../lib/date'
import { friendlyError } from '../lib/errors'

const MAX_WEEKS = 20

function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <div className="setting-row">
      <div>
        <div style={{ fontWeight: 700 }}>{label}</div>
        {hint && (
          <div className="muted" style={{ fontSize: '0.95rem' }}>
            {hint}
          </div>
        )}
      </div>
      <button
        type="button"
        className={`toggle${checked ? ' is-on' : ''}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-knob" />
      </button>
    </div>
  )
}

// Combine a day (Date) with an hour/minute into a Date in local time.
function atTime(day, hour, minute) {
  const d = new Date(day)
  d.setHours(hour, minute, 0, 0)
  return d
}

export default function CreateEventModal({
  open,
  onClose,
  groupId,
  userId,
  eventTypes,
  memberCount,
  defaultDate,
  onCreated,
}) {
  const [title, setTitle] = useState('')
  const [typeId, setTypeId] = useState('')
  const [date, setDate] = useState(() => startOfDay(defaultDate || new Date()))
  const [allDay, setAllDay] = useState(false)
  const [startH, setStartH] = useState(9)
  const [startM, setStartM] = useState(0)
  const [endH, setEndH] = useState(12)
  const [endM, setEndM] = useState(0)
  const [capacity, setCapacity] = useState(1)
  const [repeats, setRepeats] = useState(false)
  const [weeks, setWeeks] = useState(4)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Reset the day to the tapped day whenever the modal (re)opens.
  useEffect(() => {
    if (open) setDate(startOfDay(defaultDate || new Date()))
  }, [open, defaultDate])

  useEffect(() => {
    if (eventTypes?.length && !typeId) setTypeId(eventTypes[0].id)
  }, [eventTypes, typeId])

  const maxAttendees = Math.max(1, memberCount || 1)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!typeId) {
      setError('Please choose an event type.')
      return
    }

    const baseStart = allDay ? atTime(date, 0, 0) : atTime(date, startH, startM)
    const baseEnd = allDay ? atTime(date, 23, 59) : atTime(date, endH, endM)

    if (!allDay && baseEnd <= baseStart) {
      setError('The end time needs to be after the start time.')
      return
    }

    const cap = Math.max(1, Math.min(maxAttendees, capacity))
    const count = repeats ? Math.max(1, Math.min(MAX_WEEKS, weeks)) : 1
    const seriesId = count > 1 ? crypto.randomUUID() : null
    const cleanTitle = title.trim() || null

    const rows = []
    for (let i = 0; i < count; i += 1) {
      rows.push({
        group_id: groupId,
        created_by: userId,
        event_type_id: typeId,
        title: cleanTitle,
        all_day: allDay,
        capacity: cap,
        series_id: seriesId,
        start_time: addDays(baseStart, i * 7).toISOString(),
        end_time: addDays(baseEnd, i * 7).toISOString(),
      })
    }

    setBusy(true)
    try {
      const { error: err } = await createEvents(rows)
      if (err) throw err
      setTitle('')
      setRepeats(false)
      onCreated?.()
      onClose()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const typeOptions = (eventTypes || []).map((t) => ({ value: t.id, label: t.name }))

  return (
    <Modal open={open} onClose={onClose} title="Add an event">
      <form onSubmit={handleSubmit} className="stack">
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <label className="field" style={{ marginBottom: 0 }}>
          <span className="field-label">Title (optional)</span>
          <input
            className="input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lunch with Dad"
          />
        </label>

        <div className="field" style={{ marginBottom: 0 }}>
          <span className="field-label">Type</span>
          <SelectSheet
            title="Choose a type"
            value={typeId}
            onChange={setTypeId}
            options={typeOptions}
            placeholder="Choose a type"
          />
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <span className="field-label">Day</span>
          <DateField value={date} onChange={setDate} />
        </div>

        <ToggleRow label="All day" checked={allDay} onChange={setAllDay} />

        {!allDay && (
          <div className="time-row">
            <div className="field" style={{ marginBottom: 0, flex: 1 }}>
              <span className="field-label">Starts</span>
              <TimeField
                hour={startH}
                minute={startM}
                onChange={(h, m) => {
                  setStartH(h)
                  setStartM(m)
                }}
              />
            </div>
            <div className="field" style={{ marginBottom: 0, flex: 1 }}>
              <span className="field-label">Ends</span>
              <TimeField
                hour={endH}
                minute={endM}
                onChange={(h, m) => {
                  setEndH(h)
                  setEndM(m)
                }}
              />
            </div>
          </div>
        )}

        <div className="field" style={{ marginBottom: 0 }}>
          <span className="field-label">How many people are needed?</span>
          <Stepper value={capacity} min={1} max={maxAttendees} onChange={setCapacity} />
          <span className="field-hint">Up to {maxAttendees} (the size of your team).</span>
        </div>

        <ToggleRow label="Repeat every week" checked={repeats} onChange={setRepeats} />

        {repeats && (
          <div className="field" style={{ marginBottom: 0 }}>
            <span className="field-label">For how many weeks?</span>
            <Stepper value={weeks} min={1} max={MAX_WEEKS} onChange={setWeeks} suffix="weeks" />
            <span className="field-hint">Each week is signed up separately.</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
          {busy ? 'Saving…' : 'Add event'}
        </button>
      </form>
    </Modal>
  )
}
