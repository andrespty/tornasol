import { useEffect, useState } from 'react'
import Modal from './Modal'
import Avatar from './Avatar'
import { InlineLoading } from './Loading'
import { TrashIcon } from './icons'
import {
  claimShift,
  releaseShift,
  deleteShift,
  fetchNotesForShift,
  addNote,
  deleteNote,
} from '../lib/api'
import { formatDayLong, formatTimeRange, formatDateShort, formatTime } from '../lib/date'
import { friendlyError } from '../lib/errors'

export default function ShiftDetailModal({
  open,
  onClose,
  occurrence,
  memberById,
  user,
  isAdmin,
  onChanged,
}) {
  const [notes, setNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const shiftId = occurrence?.id

  useEffect(() => {
    if (!open || !shiftId) return
    let active = true
    setNotesLoading(true)
    fetchNotesForShift(shiftId).then(({ data }) => {
      if (active) {
        setNotes(data || [])
        setNotesLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [open, shiftId])

  if (!occurrence) return null

  const assignee = occurrence.assigned_user_id ? memberById.get(occurrence.assigned_user_id) : null
  const isMine = occurrence.assigned_user_id === user?.id
  const canDelete = isAdmin || occurrence.created_by === user?.id

  async function handleClaim() {
    setBusy(true)
    setError('')
    try {
      const { error: err } = await claimShift(shiftId, user.id)
      if (err) throw err
      await onChanged?.()
      onClose()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleRelease() {
    setBusy(true)
    setError('')
    try {
      const { error: err } = await releaseShift(shiftId)
      if (err) throw err
      await onChanged?.()
      onClose()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this shift? This cannot be undone.')) return
    setBusy(true)
    setError('')
    try {
      const { error: err } = await deleteShift(shiftId)
      if (err) throw err
      await onChanged?.()
      onClose()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleAddNote(e) {
    e.preventDefault()
    const text = noteText.trim()
    if (!text) return
    setBusy(true)
    setError('')
    try {
      const { error: err } = await addNote(shiftId, user.id, text)
      if (err) throw err
      setNoteText('')
      const { data } = await fetchNotesForShift(shiftId)
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

  return (
    <Modal open={open} onClose={onClose} title="Shift">
      <div className="stack-3">
        <div>
          <div className="shift-detail-day">{formatDayLong(occurrence.occurrence_start)}</div>
          <div className="shift-detail-time">
            {formatTimeRange(occurrence.occurrence_start, occurrence.occurrence_end)}
          </div>
          {occurrence.is_recurring && (
            <p className="muted" style={{ marginTop: 'var(--space-1)', marginBottom: 0 }}>
              Repeats weekly. Taking it assigns you each week until released.
            </p>
          )}
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <div>
          {assignee ? (
            <div className="stack">
              <div className="shift-assignee">
                <Avatar name={assignee.name} initials={assignee.initials} />
                <div>
                  <div style={{ fontWeight: 700 }}>{isMine ? 'You' : assignee.name}</div>
                  <div className="muted" style={{ fontSize: '0.95rem' }}>
                    {isMine ? 'You have this shift' : 'has this shift'}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-outline btn-block"
                onClick={handleRelease}
                disabled={busy}
              >
                Release shift
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={handleClaim}
              disabled={busy}
            >
              Take this shift
            </button>
          )}
        </div>

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
                  n.author?.display_name || n.author?.email || memberById.get(n.author_id)?.name || 'Member'
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

        {canDelete && (
          <button className="btn btn-danger btn-block" onClick={handleDelete} disabled={busy}>
            Delete shift
          </button>
        )}
      </div>
    </Modal>
  )
}
