import { useCallback, useEffect, useState } from 'react'
import { useGroups } from '../../context/GroupContext'
import { useI18n } from '../../context/LanguageContext'
import { fetchNotesForGroup } from '../../lib/api'
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh'
import { InlineLoading } from '../../components/Loading'
import Avatar from '../../components/Avatar'
import { formatDateShort, formatTime, formatTimeRange } from '../../lib/date'

export default function Notes() {
  const { activeGroupId } = useGroups()
  const { t } = useI18n()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!activeGroupId) return
    const { data } = await fetchNotesForGroup(activeGroupId)
    setNotes(data || [])
    setLoading(false)
  }, [activeGroupId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  // event_notes has no group_id column, so watch the whole table and refetch.
  useRealtimeRefresh(
    'event_notes',
    { channelKey: `notes-${activeGroupId}`, enabled: !!activeGroupId },
    load
  )


  return (
    <div className="page stack-3">
      <div>
        <h1>{t('notes.title')}</h1>
        <p className="muted">{t('notes.intro')}</p>
      </div>

      {loading ? (
        <InlineLoading label={t('common.loadingNotes')} />
      ) : notes.length === 0 ? (
        <div className="card">
          <p style={{ marginBottom: 0 }}>{t('notes.empty')}</p>
        </div>
      ) : (
        <ul className="note-list">
          {notes.map((n) => {
            const author = n.author?.display_name || n.author?.email || t('common.member')
            return (
              <li key={n.id} className="card card-notes note-item">
                {n.event && (
                  <div className="note-shift-label">
                    {formatDateShort(n.event.start_time)}{' '}
                    {formatTimeRange(n.event.start_time, n.event.end_time)}
                  </div>
                )}
                <p style={{ whiteSpace: 'pre-wrap', margin: 'var(--space-1) 0' }}>{n.content}</p>
                <div className="note-meta">
                  <span className="note-author">
                    <Avatar
                      name={author}
                      initials={n.author?.avatar_initials}
                      size="sm"
                    />
                    {author}
                  </span>
                  <span>
                    {formatDateShort(n.created_at)} · {formatTime(n.created_at)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
