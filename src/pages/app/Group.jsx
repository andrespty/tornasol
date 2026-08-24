import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGroups } from '../../context/GroupContext'
import { fetchGroupMembers, createInvite } from '../../lib/api'
import { useRealtimeRefresh } from '../../hooks/useRealtimeRefresh'
import { InlineLoading } from '../../components/Loading'
import Avatar from '../../components/Avatar'
import { friendlyError } from '../../lib/errors'
import { CopyIcon } from '../../components/icons'

export default function Group() {
  const { user } = useAuth()
  const { activeGroup, activeGroupId, isAdmin } = useGroups()

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
          {members.length} {members.length === 1 ? 'person' : 'people'} on this care team
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
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Invite */}
      {isAdmin ? (
        <section className="card stack">
          <h2 style={{ marginBottom: 0 }}>Invite someone</h2>
          <p className="muted" style={{ margin: 0 }}>
            Create a link and share it, or send it by email.
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

              <a className="btn btn-outline btn-block" href={emailHref}>
                Send by email
              </a>

              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  className="btn btn-ghost btn-block"
                  onClick={() =>
                    navigator
                      .share({
                        title: 'Tornasol invite',
                        text: `Join ${activeGroup?.name || 'our care team'} on Tornasol`,
                        url: inviteUrl,
                      })
                      .catch(() => {})
                  }
                >
                  Share…
                </button>
              )}

              <p className="field-hint">This link works for 14 days.</p>
            </div>
          )}
        </section>
      ) : (
        <section className="card">
          <p className="muted" style={{ marginBottom: 0 }}>
            Only the team admin can invite new people. Ask them to send you a
            link.
          </p>
        </section>
      )}
    </div>
  )
}
