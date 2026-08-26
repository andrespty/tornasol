import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import Avatar from './Avatar'
import { InlineLoading } from './Loading'
import { TrashIcon } from './icons'
import {
  signUpForEvent,
  giveUpSpot,
  transferSpot,
  deleteEvent,
  deleteEventSeriesFrom,
  fetchNotesForEvent,
  addNote,
  deleteNote,
} from '../lib/api'
import { formatDayLong, formatEventWhen, formatDateShort, formatTime } from '../lib/date'
import { openWhatsApp, buildEventShareText } from '../lib/share'
import { WhatsAppIcon } from './icons'
import { friendlyError } from '../lib/errors'

export default function EventDetailModal({
  open,
  onClose,
  event,
  attendeeIds,
  memberById,
  members,
  user,
  isAdmin,
  onChanged,
}) {
  const [notes, setNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const eventId = event?.id

  useEffect(() => {
    if (!open || !eventId) return
    let active = true
    setNotesLoading(true)
    setError('')
    setTransferTo('')
    fetchNotesForEvent(eventId).then(({ data }) => {
      if (active) {
        setNotes(data || [])
        setNotesLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [open, eventId])

  const ids = attendeeIds || []
  const isSignedUp = ids.includes(user?.id)
  const isFull = ids.length >= (event?.capacity || 1)
  const canDelete = isAdmin || event?.created_by === user?.id

  const transferCandidates = useMemo(
    () => (members || []).filter((m) => !ids.includes(m.userId)),
    [members, ids]
  )

  if (!event) return null

  function shareToWhatsApp() {
    const url = `${window.location.origin}/app/calendar?event=${event.id}`
    openWhatsApp(
      buildEventShareText({
        typeName: event.type?.name || 'Event',
        title: event.title,
        dayLine: formatDayLong(event.start_time),
        whenLine: formatEventWhen(event),
        signedUp: ids.length,
        capacity: event.capacity,
        url,
      })
    )
  }

  async function run(fn) {
    setBusy(true)
    setError('')
    try {
      const { error: err } = (await fn()) || {}
      if (err) throw err
      await onChanged?.()
      onClose()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleTransfer() {
    if (!transferTo) return
    await run(() => transferSpot(eventId, transferTo))
  }

  async function handleDelete(series) {
    const msg = series
      ? 'Delete this event and all future repeats? This cannot be undone.'
      : 'Delete this event? This cannot be undone.'
    if (!window.confirm(msg)) return
    await run(() =>
      series ? deleteEventSeriesFrom(event.series_id, event.start_time) : deleteEvent(eventId)
    )
  }

  async function handleAddNote(e) {
    e.preventDefault()
    const text = noteText.trim()
    if (!text) return
    setBusy(true)
    setError('')
    try {
      const { error: err } = await addNote(eventId, user.id, text)
      if (err) throw err
      setNoteText('')
      const { data } = await fetchNotesForEvent(eventId)
      setNotes(data || [])
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteNote(noteId) {
    const { error: err } = await deleteNote(noteId)
    if (!err) setNotes((prev) => prev.filter((n) => n.id !== noteId))
  }

  const spotsText = `${ids.length} / ${event.capacity} signed up`

  return (
    <Modal open={open} onClose={onClose} title="Event">
      <div className="stack-3">
        <div>
          {event.type && (
            <span
              className="type-badge"
              style={{ backgroundColor: event.type.color }}
            >
              {event.type.name}
            </span>
          )}
          {event.title && <div className="event-detail-title">{event.title}</div>}
          <div className="shift-detail-day">{formatDayLong(event.start_time)}</div>
          <div className="shift-detail-time">{formatEventWhen(event)}</div>
          {event.series_id && (
            <p className="muted" style={{ marginTop: 'var(--space-1)', marginBottom: 0 }}>
              Part of a weekly series — this is just this week.
            </p>
          )}
        </div>

        <button type="button" className="btn btn-whatsapp btn-block" onClick={shareToWhatsApp}>
          <WhatsAppIcon /> Share to WhatsApp
        </button>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {/* Attendees */}
        <div className="stack">
          <div className="attendee-head">
            <h3 style={{ margin: 0 }}>Who's coming</h3>
            <span className={`pill ${isFull ? 'pill-taken' : 'pill-open'}`}>{spotsText}</span>
          </div>

          {ids.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>No one has signed up yet.</p>
          ) : (
            <ul className="attendee-list">
              {ids.map((id) => {
                const m = memberById.get(id)
                return (
                  <li key={id} className="attendee-item">
                    <Avatar name={m?.name} initials={m?.initials} size="sm" />
                    <span>{id === user?.id ? 'You' : m?.name || 'Member'}</span>
                  </li>
                )
              })}
            </ul>
          )}

          {isSignedUp ? (
            <div className="stack">
              <button
                className="btn btn-outline btn-block"
                onClick={() => run(() => giveUpSpot(eventId, user.id))}
                disabled={busy}
              >
                Give up my spot
              </button>

              {transferCandidates.length > 0 && (
                <div className="transfer-row">
                  <select
                    className="select"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    aria-label="Transfer my spot to"
                  >
                    <option value="">Transfer my spot to…</option>
                    {transferCandidates.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.userId === user?.id ? 'Me' : m.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleTransfer}
                    disabled={busy || !transferTo}
                  >
                    Transfer
                  </button>
                </div>
              )}
            </div>
          ) : isFull ? (
            <div className="alert alert-info" style={{ margin: 0 }}>
              This event is full.
            </div>
          ) : (
            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={() => run(() => signUpForEvent(eventId, user.id))}
              disabled={busy}
            >
              Sign up
            </button>
          )}
        </div>

        {/* Handoff notes */}
        <div className="stack">
          <h3 style={{ marginBottom: 0 }}>Handoff notes</h3>
          <p className="muted" style={{ margin: 0, fontSize: '0.95rem' }}>
            Meds, meals, mood — anything the next person should know.
          </p>

          {notesLoading ? (
            <InlineLoading label="Loading notes…" />
          ) : notes.length === 0 ? (
            <p className="muted" style={{ marginBottom: 0 }}>No notes yet.</p>
          ) : (
            <ul className="note-list">
              {notes.map((n) => {
                const author =
                  n.author?.display_name ||
                  n.author?.email ||
                  memberById.get(n.author_id)?.name ||
                  'Member'
                return (
                  <li key={n.id} className="card card-notes note-item">
                    <p style={{ marginBottom: 'var(--space-1)', whiteSpace: 'pre-wrap' }}>
                      {n.content}
                    </p>
                    <div className="note-meta">
                      <span>
                        {author} · {formatDateShort(n.created_at)} {formatTime(n.created_at)}
                      </span>
                      {n.author_id === user?.id && (
                        <button
                          className="icon-btn"
                          aria-label="Delete note"
                          onClick={() => handleDeleteNote(n.id)}
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <form onSubmit={handleAddNote} className="stack">
            <label className="field" style={{ marginBottom: 0 }}>
              <span className="visually-hidden">Add a note</span>
              <textarea
                className="textarea"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write a note for the next caregiver…"
              />
            </label>
            <button className="btn btn-secondary btn-block" disabled={busy || !noteText.trim()}>
              Add note
            </button>
          </form>
        </div>

        {/* Delete */}
        {canDelete && (
          <div className="stack">
            <button className="btn btn-danger btn-block" onClick={() => handleDelete(false)} disabled={busy}>
              Delete this event
            </button>
            {event.series_id && (
              <button
                className="btn btn-danger btn-block"
                onClick={() => handleDelete(true)}
                disabled={busy}
              >
                Delete this &amp; future repeats
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
