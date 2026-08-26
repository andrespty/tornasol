import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGroups } from '../../context/GroupContext'
import { useI18n } from '../../context/LanguageContext'
import {
  fetchGroupMembers,
  createInvite,
  updateGroupSetting,
  deleteGroup,
  fetchEvents,
  fetchAttendeesForGroup,
} from '../../lib/api'
import { shareWeekOnWhatsApp } from '../../lib/share'
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh'
import { InlineLoading } from '../../components/Loading'
import Avatar from '../../components/Avatar'
import Modal from '../../components/Modal'
import EventTypesManager from '../../components/EventTypesManager'
import { friendlyError } from '../../lib/errors'
import { CopyIcon, WhatsAppIcon } from '../../components/icons'

export default function Group() {
  const { user } = useAuth()
  const { activeGroup, activeGroupId, isAdmin, refreshGroups } = useGroups()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [savingSetting, setSavingSetting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteUrl, setInviteUrl] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!activeGroupId) return
    const { data } = await fetchGroupMembers(activeGroupId)
    setMembers(data || [])
    setLoading(false)
  }, [activeGroupId])

  useEffect(() => {
    setLoading(true)
    setInviteUrl('')
    setCopied(false)
    load()
  }, [load])

  useRealtimeRefresh(
    'group_members',
    { filter: `group_id=eq.${activeGroupId}`, channelKey: `members-${activeGroupId}`, enabled: !!activeGroupId },
    load
  )

  async function handleCreateInvite() {
    setInviteBusy(true)
    setError('')
    setCopied(false)
    try {
      const { data, error: err } = await createInvite(activeGroupId, user.id)
      if (err) throw err
      setInviteUrl(`${window.location.origin}/invite/${data.token}`)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setInviteBusy(false)
    }
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  const allowMemberEvents = activeGroup?.allow_member_shift_creation ?? true

  async function toggleMemberEvents() {
    setSavingSetting(true)
    const { error: err } = await updateGroupSetting(activeGroupId, {
      allow_member_shift_creation: !allowMemberEvents,
    })
    if (!err) await refreshGroups()
    setSavingSetting(false)
  }

  async function handleDeleteGroup() {
    setDeleting(true)
    setError('')
    try {
      const { error: err } = await deleteGroup(activeGroupId)
      if (err) throw err
      setShowDelete(false)
      await refreshGroups()
      navigate('/app')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setDeleting(false)
    }
  }

  const canConfirmDelete = confirmName.trim() === (activeGroup?.name || '').trim()

  const [sharing, setSharing] = useState(false)
  async function shareThisWeek() {
    setSharing(true)
    try {
      const [evRes, attRes] = await Promise.all([
        fetchEvents(activeGroupId),
        fetchAttendeesForGroup(activeGroupId),
      ])
      const counts = new Map()
      ;(attRes.data || []).forEach((a) =>
        counts.set(a.event_id, (counts.get(a.event_id) || 0) + 1)
      )
      shareWeekOnWhatsApp({
        events: evRes.data || [],
        attendeeCountByEvent: counts,
        groupName: activeGroup?.name || 'our care team',
        origin: window.location.origin,
      })
    } finally {
      setSharing(false)
    }
  }

  const emailHref = inviteUrl
    ? `mailto:?subject=${encodeURIComponent(
        `Join ${activeGroup?.name || 'our care team'} on Tornasol`
      )}&body=${encodeURIComponent(
        `Hi,\n\nPlease join ${activeGroup?.name || 'our care team'} on Tornasol so we can coordinate care together.\n\nTap this link to join:\n${inviteUrl}\n\nThank you!`
      )}`
    : '#'

  return (
    <div className="page stack-3">
      <div>
        <h1>{activeGroup?.name}</h1>
        <p className="muted">
          {members.length} {members.length === 1 ? t('group.person') : t('group.people')}{' '}
          {t('group.onTeam')}
        </p>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {/* Members */}
      <section className="card stack">
        <h2 style={{ marginBottom: 0 }}>{t('group.peopleHeading')}</h2>
        {loading ? (
          <InlineLoading label={t('common.loading')} />
        ) : (
          <ul className="member-list">
            {members.map((m) => {
              const isSelf = m.userId === user?.id
              const memberIsAdmin = m.userId === activeGroup?.admin_id
              return (
                <li key={m.userId} className="member-item">
                  <Avatar name={m.name} initials={m.initials} />
                  <div className="member-info">
                    <span className="member-name">
                      {m.name}
                      {isSelf && ` (${t('common.you').toLowerCase()})`}
                    </span>
                    {memberIsAdmin && <span className="pill pill-admin">{t('group.admin')}</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Invite */}
      {isAdmin ? (
        <section className="card stack">
          <h2 style={{ marginBottom: 0 }}>{t('group.inviteTitle')}</h2>
          <p className="muted" style={{ margin: 0 }}>{t('group.inviteIntro')}</p>

          {!inviteUrl ? (
            <button
              className="btn btn-secondary btn-block"
              onClick={handleCreateInvite}
              disabled={inviteBusy}
            >
              {inviteBusy ? t('group.creatingLink') : t('group.createLink')}
            </button>
          ) : (
            <div className="stack">
              <div className="invite-box">
                <input
                  className="input"
                  readOnly
                  value={inviteUrl}
                  onFocus={(e) => e.target.select()}
                  aria-label={t('group.createLink')}
                />
                <button className="btn btn-secondary btn-sm invite-copy" onClick={copyInvite}>
                  <CopyIcon /> {copied ? t('group.copied') : t('group.copy')}
                </button>
              </div>

              <a className="btn btn-outline btn-block" href={emailHref}>
                {t('group.sendEmail')}
              </a>

              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  className="btn btn-ghost btn-block"
                  onClick={() =>
                    navigator
                      .share({
                        title: 'Tornasol',
                        text: `Join ${activeGroup?.name || 'our care team'} on Tornasol`,
                        url: inviteUrl,
                      })
                      .catch(() => {})
                  }
                >
                  {t('group.share')}
                </button>
              )}

              <p className="field-hint">{t('group.linkExpires')}</p>
            </div>
          )}
        </section>
      ) : (
        <section className="card">
          <p className="muted" style={{ marginBottom: 0 }}>
            {t('group.onlyAdminInvite')}
          </p>
        </section>
      )}

      {/* Admin settings */}
      {isAdmin && (
        <>
          <section className="card stack">
            <h2 style={{ marginBottom: 0 }}>{t('group.settings')}</h2>
            <div className="setting-row">
              <div>
                <div style={{ fontWeight: 700 }}>{t('group.membersCanCreate')}</div>
                <div className="muted" style={{ fontSize: '0.95rem' }}>
                  {allowMemberEvents ? t('group.membersCanCreateOn') : t('group.membersCanCreateOff')}
                </div>
              </div>
              <button
                className={`toggle${allowMemberEvents ? ' is-on' : ''}`}
                role="switch"
                aria-checked={allowMemberEvents}
                aria-label={t('group.membersCanCreate')}
                onClick={toggleMemberEvents}
                disabled={savingSetting}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          </section>

          <section className="card stack">
            <h2 style={{ marginBottom: 0 }}>{t('group.shareFamily')}</h2>
            <p className="muted" style={{ margin: 0 }}>{t('group.shareFamilyIntro')}</p>
            <button className="btn btn-whatsapp btn-sm share-week-inline" onClick={shareThisWeek} disabled={sharing}>
              <WhatsAppIcon /> {sharing ? t('group.preparing') : t('group.shareThisWeek')}
            </button>
          </section>

          <EventTypesManager groupId={activeGroupId} />

          <section className="card stack">
            <h2 style={{ marginBottom: 0 }}>{t('group.dangerZone')}</h2>
            <p className="muted" style={{ margin: 0 }}>{t('group.deleteIntro')}</p>
            <button
              className="btn btn-danger btn-block"
              onClick={() => {
                setConfirmName('')
                setShowDelete(true)
              }}
            >
              {t('group.deleteTeam')}
            </button>
          </section>
        </>
      )}

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title={t('group.deleteModalTitle')}>
        <div className="stack">
          <p style={{ margin: 0 }}>{t('group.deleteConfirmBody', { name: activeGroup?.name })}</p>
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="field-label">{t('group.teamName')}</span>
            <input
              className="input"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={activeGroup?.name}
              autoComplete="off"
            />
          </label>
          <button
            className="btn btn-danger btn-block btn-lg"
            onClick={handleDeleteGroup}
            disabled={!canConfirmDelete || deleting}
          >
            {deleting ? t('group.deleting') : t('group.deleteForever')}
          </button>
          <button className="btn btn-ghost btn-block" onClick={() => setShowDelete(false)}>
            {t('common.cancel')}
          </button>
        </div>
      </Modal>
    </div>
  )
}
