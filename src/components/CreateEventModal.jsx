import { useEffect, useState } from 'react'
import Modal from './Modal'
import { createEvents } from '../lib/api'
import { addDays } from '../lib/date'
import { friendlyError } from '../lib/errors'

function pad(n) {
  return String(n).padStart(2, '0')
}

const MAX_WEEKS = 20

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
  const initialDate = defaultDate || new Date()
  const [date, setDate] = useState(
    `${initialDate.getFullYear()}-${pad(initialDate.getMonth() + 1)}-${pad(initialDate.getDate())}`
  )
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('12:00')
  const [typeId, setTypeId] = useState('')
  const [capacity, setCapacity] = useState(1)
  const [repeats, setRepeats] = useState(false)
  const [weeks, setWeeks] = useState(4)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Default the type to the first available whenever the list changes.
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
    const startAt = new Date(`${date}T${start}`)
    const endAt = new Date(`${date}T${end}`)
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      setError('Please choose a valid date and time.')
      return
    }
    if (endAt <= startAt) {
      setError('The end time needs to be after the start time.')
      return
    }
    const cap = Math.max(1, Math.min(maxAttendees, parseInt(capacity, 10) || 1))
    const count = repeats ? Math.max(1, Math.min(MAX_WEEKS, parseInt(weeks, 10) || 1)) : 1
    const seriesId = count > 1 ? crypto.randomUUID() : null

    const rows = []
    for (let i = 0; i < count; i += 1) {
      const s = addDays(startAt, i * 7)
      const en = addDays(endAt, i * 7)
      rows.push({
        group_id: groupId,
        created_by: userId,
        event_type_id: typeId,
        capacity: cap,
        series_id: seriesId,
        start_time: s.toISOString(),
        end_time: en.toISOString(),
      })
    }

    setBusy(true)
    try {
      const { error: err } = await createEvents(rows)
      if (err) throw err
      onCreated?.()
      onClose()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add an event">
      <form onSubmit={handleSubmit} className="stack">
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <label className="field" style={{ marginBottom: 0 }}>
          <span className="field-label">Type</span>
          <select
            className="select"
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            required
          >
            {(eventTypes || []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field" style={{ marginBottom: 0 }}>
          <span className="field-label">Day</span>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <div className="time-row">
          <label className="field" style={{ marginBottom: 0, flex: 1 }}>
            <span className="field-label">Starts</span>
            <input
              className="input"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </label>
          <label className="field" style={{ marginBottom: 0, flex: 1 }}>
            <span className="field-label">Ends</span>
            <input
              className="input"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </label>
        </div>

        <label className="field" style={{ marginBottom: 0 }}>
          <span className="field-label">How many people are needed?</span>
          <input
            className="input"
            type="number"
            min="1"
            max={maxAttendees}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            required
          />
          <span className="field-hint">
            Between 1 and {maxAttendees} (the size of your team).
          </span>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={repeats}
            onChange={(e) => setRepeats(e.target.checked)}
          />
          <span>Repeat every week</span>
        </label>

        {repeats && (
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="field-label">For how many weeks?</span>
            <input
              className="input"
              type="number"
              min="1"
              max={MAX_WEEKS}
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
            />
            <span className="field-hint">
              Up to {MAX_WEEKS} weeks. Each week is signed up separately.
            </span>
          </label>
        )}

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
          {busy ? 'Saving…' : 'Add event'}
        </button>
      </form>
    </Modal>
  )
}
