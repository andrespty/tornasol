import { useState } from 'react'
import Modal from './Modal'
import { createShift } from '../lib/api'
import { buildWeeklyRule } from '../lib/date'
import { friendlyError } from '../lib/errors'

function pad(n) {
  return String(n).padStart(2, '0')
}

export default function CreateShiftModal({ open, onClose, groupId, userId, defaultDate, onCreated }) {
  const initialDate = defaultDate || new Date()
  const [date, setDate] = useState(
    `${initialDate.getFullYear()}-${pad(initialDate.getMonth() + 1)}-${pad(initialDate.getDate())}`
  )
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('12:00')
  const [repeats, setRepeats] = useState(false)
  const [weeks, setWeeks] = useState(4)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function reset() {
    setStart('09:00')
    setEnd('12:00')
    setRepeats(false)
    setWeeks(4)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

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

    setBusy(true)
    try {
      const { data, error: err } = await createShift({
        group_id: groupId,
        created_by: userId,
        start_time: startAt.toISOString(),
        end_time: endAt.toISOString(),
        recurrence_rule: repeats ? buildWeeklyRule(weeks) : null,
      })
      if (err) throw err
      reset()
      onCreated?.(data)
      onClose()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a shift">
      <form onSubmit={handleSubmit} className="stack">
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

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
              max="52"
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
            />
            <span className="field-hint">
              Taking a repeating shift assigns it to you each week until it's
              released.
            </span>
          </label>
        )}

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
          {busy ? 'Saving…' : 'Add shift'}
        </button>
      </form>
    </Modal>
  )
}
