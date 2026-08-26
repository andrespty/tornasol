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
import { useI18n } from '../context/LanguageContext'
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
  const { t } = useI18n()

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
    const msg = series ? t('event.confirmDeleteSeries') : t('event.confirmDelete')
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

  const spotsText = t('event.signedUp', { n: ids.length, cap: event.capacity })

  return (
    <Modal open={open} onClose={onClose} title={t('event.title')}>
      <div className="stack-3">
        <div className="event-detail-header">
          <div>
            {event.type && (
              <span className="type-badge" style={{ backgroundColor: event.type.color }}>
                {event.type.name}
              </span>
            )}
            {event.title && <div className="event-detail-title">{event.title}</div>}
            <div className="shift-detail-day">{formatDayLong(event.start_time)}</div>
            <div className="shift-detail-time">{formatEventWhen(event)}</div>
            {event.series_id && (
              <p className="muted" style={{ marginTop: 'var(--space-1)', marginBottom: 0 }}>
                {t('event.seriesNote')}
              </p>
            )}
          </div>
          <button
            type="button"
            className="share-icon-btn"
            onClick={shareToWhatsApp}
            aria-label={t('event.share')}
            title={t('event.share')}
          >
            <WhatsAppIcon />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {/* Attendees */}
        <div className="stack">
          <div className="attendee-head">
            <h3 style={{ margin: 0 }}>{t('event.whosComing')}</h3>
            <span className={`pill ${isFull ? 'pill-taken' : 'pill-open'}`}>{spotsText}</span>
          </div>

          {ids.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>{t('event.noOneYet')}</p>
          ) : (
            <ul className="attendee-list">
              {ids.map((id) => {
                const m = memberById.get(id)
                return (
                  <li key={id} className="attendee-item">
                    <Avatar name={m?.name} initials={m?.initials} size="sm" />
                    <span>{id === user?.id ? t('common.you') : m?.name || t('common.member')}</span>
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
                {t('event.giveUp')}
              </button>

              {transferCandidates.length > 0 && (
                <div className="transfer-row">
                  <select
                    className="select"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    aria-label={t('event.transferTo')}
                  >
                    <option value="">{t('event.transferTo')}</option>
                    {transferCandidates.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.userId === user?.id ? t('common.me') : m.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleTransfer}
                    disabled={busy || !transferTo}
                  >
                    {t('event.transfer')}
                  </button>
                </div>
              )}
            </div>
          ) : isFull ? (
            <div className="alert alert-info" style={{ margin: 0 }}>
              {t('event.isFull')}
            </div>
          ) : (
            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={() => run(() => signUpForEvent(eventId, user.id))}
              disabled={busy}
            >
              {t('event.signUp')}
            </button>
          )}
        </div>

        {/* Handoff notes */}
        <div className="stack">
          <h3 style={{ marginBottom: 0 }}>{t('event.notesTitle')}</h3>
          <p className="muted" style={{ margin: 0, fontSize: '0.95rem' }}>
            {t('event.notesHint')}
          </p>

          {notesLoading ? (
            <InlineLoading label={t('common.loadingNotes')} />
          ) : notes.length === 0 ? (
            <p className="muted" style={{ marginBottom: 0 }}>{t('event.noNotes')}</p>
          ) : (
            <ul className="note-list">
              {notes.map((n) => {
                const author =
                  n.author?.display_name ||
                  n.author?.email ||
                  memberById.get(n.author_id)?.name ||
                  t('common.member')
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
                          aria-label={t('event.deleteNote')}
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
              <span className="visually-hidden">{t('event.addNote')}</span>
              <textarea
                className="textarea"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={t('event.notePlaceholder')}
              />
            </label>
            <button className="btn btn-secondary btn-block" disabled={busy || !noteText.trim()}>
              {t('event.addNote')}
            </button>
          </form>
        </div>

        {/* Delete */}
        {canDelete && (
          <div className="stack">
            <button className="btn btn-danger btn-block" onClick={() => handleDelete(false)} disabled={busy}>
              {t('event.deleteThis')}
            </button>
            {event.series_id && (
              <button
                className="btn btn-danger btn-block"
                onClick={() => handleDelete(true)}
                disabled={busy}
              >
                {t('event.deleteFuture')}
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
