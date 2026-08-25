import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'

const GroupContext = createContext(null)
const ACTIVE_GROUP_KEY = 'tornasol-active-group'

export function GroupProvider({ children }) {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [activeGroupId, setActiveGroupId] = useState(
    () => window.localStorage.getItem(ACTIVE_GROUP_KEY) || null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadGroups = useCallback(async () => {
    if (!user) {
      setGroups([])
      setLoading(false)
      return { error: null }
    }
    setLoading(true)
    // Groups the user belongs to, via their memberships.
    const { data, error: loadError } = await supabase
      .from('group_members')
      .select('group:groups(id, name, admin_id, allow_member_shift_creation, created_at)')
      .eq('user_id', user.id)

    if (loadError) {
      // Surface instead of swallowing — a silent read failure here looks like
      // "I created a group but nothing happened".
      // eslint-disable-next-line no-console
      console.error('Tornasol: could not load your groups:', loadError)
      setError(loadError)
      setLoading(false)
      return { error: loadError }
    }

    const rows = data || []
    const list = rows
      .map((row) => row.group)
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name))

    // If we have membership rows but every embedded group came back null, the
    // `groups` table's RLS is blocking the read even though membership exists.
    if (rows.length > 0 && list.length === 0) {
      const rlsError = {
        message:
          'Your membership exists but the groups table is not readable — check the "groups" row-level-security SELECT policy.',
        code: 'RLS_GROUPS_HIDDEN',
      }
      // eslint-disable-next-line no-console
      console.error('Tornasol:', rlsError.message, rows)
      setGroups([])
      setError(rlsError)
      setLoading(false)
      return { error: rlsError }
    }

    setGroups(list)
    setError(null)
    setLoading(false)
    return { error: null }
  }, [user])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  // Ensure the active group is always one the user actually belongs to.
  useEffect(() => {
    if (loading) return
    if (groups.length === 0) {
      setActiveGroupId(null)
      return
    }
    const stillValid = groups.some((g) => g.id === activeGroupId)
    if (!stillValid) {
      setActiveGroupId(groups[0].id)
    }
  }, [groups, activeGroupId, loading])

  useEffect(() => {
    if (activeGroupId) {
      window.localStorage.setItem(ACTIVE_GROUP_KEY, activeGroupId)
    } else {
      window.localStorage.removeItem(ACTIVE_GROUP_KEY)
    }
  }, [activeGroupId])

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) || null,
    [groups, activeGroupId]
  )

  const isAdmin = Boolean(activeGroup && user && activeGroup.admin_id === user.id)

  const canCreateEvent = Boolean(
    activeGroup && (isAdmin || activeGroup.allow_member_shift_creation)
  )

  const value = useMemo(
    () => ({
      groups,
      activeGroup,
      activeGroupId,
      isAdmin,
      canCreateEvent,
      loading,
      error,
      setActiveGroupId,
      refreshGroups: loadGroups,
      hasNoGroups: !loading && groups.length === 0,
    }),
    [groups, activeGroup, activeGroupId, isAdmin, canCreateEvent, loading, error, loadGroups]
  )

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}

export function useGroups() {
  const ctx = useContext(GroupContext)
  if (!ctx) throw new Error('useGroups must be used within a GroupProvider')
  return ctx
}
