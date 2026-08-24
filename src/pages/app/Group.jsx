import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGroups } from '../../context/GroupContext'
import {
  fetchGroupMembers,
  createInvite,
  updateGroupSetting,
  removeMember,
} from '../../lib/api'
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh'
import { InlineLoading } from '../../components/Loading'
import Avatar from '../../components/Avatar'
import Modal from '../../components/Modal'
import CreateGroupCard from '../../components/CreateGroupCard'
import { friendlyError } from '../../lib/errors'
import { CopyIcon } from '../../components/icons'

export default function Group() {
  const { user, profile, signOut } = useAuth()
  const { activeGroup, activeGroupId, isAdmin, hasNoGroups, refreshGroups } = useGroups()
  const navigate = useNavigate()

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteUrl, setInviteUrl] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [savingSetting, setSavingSetting] = useState(false)

  const load = useCallback(async () => {
    if (!activeGroupId) return
    const { data } = await fetchGroupMembers(activeGroupId)
    setMembers(data || [])
    setLoading(false)
  }, [activeGroupId])

  useEffect(() => {
    setLoading(true)
    setInviteUrl('')
    load()
  }, [load])

  useRealtimeRefresh(
    'group_members',
    { filter: `group_id=eq.${activeGroupId}`, channelKey: `members-${activeGroupId}`, enabled: !!activeGroupId },
    load
  )

  const allowMemberShifts = activeGroup?.allow_member_shift_creation ?? true

  async function handleCreateInvite() {
    setInviteBusy(true)
    setError('')
    setCopied(false)
    try {
      const { data, error: err } = await createInvite(activeGroupId, user.id)
      if (err) throw err
      const url = `${window.location.origin}/invite/${data.token}`
      setInviteUrl(url)
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
      // Clipboard may be blocked; the field is selectable as a fallback.
      setCopied(false)
    }
  }

  async function toggleMemberShifts() {
    setSavingSetting(true)
    const next = !allowMemberShifts
    const { error: err } = await updateGroupSetting(activeGroupId, {
      allow_member_shift_creation: next,
    })
    if (!err) await refreshGroups()
    setSavingSetting(false)
  }

  async function handleRemove(member) {
    if (!window.confirm(`Remove ${member.name} from this group?`)) return
    const { error: err } = await removeMember(activeGroupId, member.userId)
    if (err) setError(friendlyError(err))
    else load()
  }

  async function handleLeave() {
    if (
      !window.confirm(
        isAdmin
          ? 'You are the admin. Leaving may leave this group without an admin. Continue?'
          : 'Leave this group?'
      )
    )
      return
    const { error: err } = await removeMember(activeGroupId, user.id)
    if (err) {
      setError(friendlyError(err))
    } else {
      await refreshGroups()
      navigate('/app')
    }
  }

  const shareText = useMemo(
    () => `Join our care team on Tornasol: ${inviteUrl}`,
    [inviteUrl]
  )

  if (hasNoGroups) {
    return (
      <div className="page stack-3">
        <h1>Your group</h1>
        <CreateGroupCard />
        <AccountCard profile={profile} email={user?.email} onSignOut={signOut} />
      </div>
    )
  }

  return (
    <div className="page stack-3">
      <div>
        <h1>{activeGroup?.name}</h1>
        <p className="muted">
          {members.length} {members.length === 1 ? 'person' : 'people'} on this care team
          {isAdmin && ' · You are the admin'}
        </p>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {/* Members */}
      <section className="card stack">
        <h2 style={{ marginBottom: 0 }}>People</h2>
        {loading ? (
          <InlineLoading />
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
                      {isSelf && ' (you)'}
                    </span>
                    {memberIsAdmin && <span className="pill pill-admin">Admin</span>}
                  </div>
                  {isAdmin && !isSelf && (
                    <button
                      className="link-btn member-remove"
                      onClick={() => handleRemove(m)}
                    >
                      Remove
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Invite */}
      {isAdmin && (
        <section className="card stack">
          <h2 style={{ marginBottom: 0 }}>Invite someone</h2>
          <p className="muted" style={{ margin: 0 }}>
            Create a link and share it however you like — text, email, or
            WhatsApp.
          </p>
          {!inviteUrl ? (
            <button
              className="btn btn-secondary btn-block"
              onClick={handleCreateInvite}
              disabled={inviteBusy}
            >
              {inviteBusy ? 'Creating link…' : 'Create invite link'}
            </button>
          ) : (
            <div className="stack">
              <div className="invite-box">
                <input
                  className="input"
                  readOnly
                  value={inviteUrl}
                  onFocus={(e) => e.target.select()}
                  aria-label="Invite link"
                />
                <button className="btn btn-secondary btn-sm invite-copy" onClick={copyInvite}>
                  <CopyIcon /> {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  className="btn btn-outline btn-block"
                  onClick={() =>
                    navigator
                      .share({ title: 'Tornasol invite', text: shareText, url: inviteUrl })
                      .catch(() => {})
                  }
                >
                  Share link
                </button>
              )}
              <p className="field-hint">This link works for 14 days.</p>
            </div>
          )}
        </section>
      )}

      {/* Admin settings */}
      {isAdmin && (
        <section className="card stack">
          <h2 style={{ marginBottom: 0 }}>Group settings</h2>
          <div className="setting-row">
            <div>
              <div style={{ fontWeight: 700 }}>Members can create shifts</div>
              <div className="muted" style={{ fontSize: '0.95rem' }}>
                {allowMemberShifts
                  ? 'Anyone can add shifts to the calendar.'
                  : 'Only you can add shifts. Others can take or release them.'}
              </div>
            </div>
            <button
              className={`toggle${allowMemberShifts ? ' is-on' : ''}`}
              role="switch"
              aria-checked={allowMemberShifts}
              aria-label="Members can create shifts"
              onClick={toggleMemberShifts}
              disabled={savingSetting}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </section>
      )}

      {/* This group actions + account */}
      <section className="card stack">
        <h2 style={{ marginBottom: 0 }}>You</h2>
        <button className="btn btn-ghost btn-block" onClick={() => setShowNewGroup(true)}>
          Start another care team
        </button>
        <button className="btn btn-danger btn-block" onClick={handleLeave}>
          Leave this group
        </button>
      </section>

      <AccountCard profile={profile} email={user?.email} onSignOut={signOut} />

      <Modal open={showNewGroup} onClose={() => setShowNewGroup(false)} title="New care team">
        <CreateGroupCard onCreated={() => setShowNewGroup(false)} />
      </Modal>
    </div>
  )
}

function AccountCard({ profile, email, onSignOut }) {
  return (
    <section className="card stack">
      <h2 style={{ marginBottom: 0 }}>Account</h2>
      <div className="member-item" style={{ padding: 0 }}>
        <Avatar name={profile?.display_name || email} initials={profile?.avatar_initials} />
        <div className="member-info">
          <span className="member-name">{profile?.display_name || 'You'}</span>
          <span className="muted" style={{ fontSize: '0.95rem' }}>
            {email}
          </span>
        </div>
      </div>
      <button className="btn btn-ghost btn-block" onClick={onSignOut}>
        Log out
      </button>
    </section>
  )
}
