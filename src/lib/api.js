import { supabase } from './supabaseClient'

/* ---------------- Groups & members ---------------- */

export async function createGroup(name) {
  return supabase.rpc('create_group', { group_name: name })
}

export async function fetchGroupMembers(groupId) {
  // group_members.user_id has a foreign key to auth.users, not profiles, so we
  // can't embed profiles directly. Fetch memberships, then their profiles, and
  // merge — robust against PostgREST relationship detection.
  const { data: rows, error } = await supabase
    .from('group_members')
    .select('user_id, joined_at')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })
  if (error) return { data: [], error }

  const ids = (rows || []).map((r) => r.user_id)
  let profilesById = {}
  if (ids.length) {
    const { data: profs, error: profErr } = await supabase
      .from('profiles')
      .select('id, display_name, email, avatar_initials')
      .in('id', ids)
    if (profErr) return { data: [], error: profErr }
    profilesById = Object.fromEntries((profs || []).map((p) => [p.id, p]))
  }

  const members = (rows || []).map((row) => {
    const profile = profilesById[row.user_id]
    return {
      userId: row.user_id,
      joinedAt: row.joined_at,
      name: profile?.display_name || profile?.email || 'Member',
      email: profile?.email || '',
      initials: profile?.avatar_initials || null,
    }
  })
  return { data: members, error: null }
}

export async function removeMember(groupId, userId) {
  return supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
}

export async function updateGroupSetting(groupId, patch) {
  return supabase.from('groups').update(patch).eq('id', groupId)
}

export async function deleteGroup(groupId) {
  return supabase.from('groups').delete().eq('id', groupId)
}

/* ---------------- Invites ---------------- */

export async function createInvite(groupId, userId, days = 14) {
  const expires = new Date()
  expires.setDate(expires.getDate() + days)
  const { data, error } = await supabase
    .from('invites')
    .insert({ group_id: groupId, created_by: userId, expires_at: expires.toISOString() })
    .select('token')
    .single()
  return { data, error }
}

/* ---------------- Event types ---------------- */

export async function fetchEventTypes(groupId) {
  return supabase
    .from('event_types')
    .select('id, name, color, sort_order')
    .eq('group_id', groupId)
    .order('sort_order', { ascending: true })
}

export async function createEventType(groupId, { name, color, sortOrder = 0 }) {
  return supabase
    .from('event_types')
    .insert({ group_id: groupId, name, color, sort_order: sortOrder })
    .select()
    .single()
}

export async function updateEventType(typeId, patch) {
  return supabase.from('event_types').update(patch).eq('id', typeId)
}

export async function deleteEventType(typeId) {
  return supabase.from('event_types').delete().eq('id', typeId)
}

/* ---------------- Events ---------------- */

export async function fetchEvents(groupId) {
  return supabase
    .from('events')
    .select('id, group_id, series_id, start_time, end_time, capacity, created_by, event_type_id, type:event_types(id, name, color)')
    .eq('group_id', groupId)
    .order('start_time', { ascending: true })
}

/**
 * Insert one or more event rows (weekly repeats materialize into separate
 * rows sharing a series_id, so each occurrence is signed up independently).
 */
export async function createEvents(rows) {
  return supabase.from('events').insert(rows).select()
}

export async function fetchAttendeesForGroup(groupId) {
  // Attendees across all of a group's events, resolved to names via the
  // members list (event_attendees.user_id -> auth.users, so no direct embed).
  const { data, error } = await supabase
    .from('event_attendees')
    .select('event_id, user_id, event:events!inner(group_id)')
    .eq('event.group_id', groupId)
  if (error) return { data: [], error }
  return { data: data || [], error: null }
}

export async function signUpForEvent(eventId, userId) {
  return supabase.from('event_attendees').insert({ event_id: eventId, user_id: userId })
}

export async function giveUpSpot(eventId, userId) {
  return supabase
    .from('event_attendees')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId)
}

export async function transferSpot(eventId, toUserId) {
  return supabase.rpc('transfer_attendance', { p_event_id: eventId, p_to_user: toUserId })
}

export async function deleteEvent(eventId) {
  return supabase.from('events').delete().eq('id', eventId)
}

export async function deleteEventSeriesFrom(seriesId, fromISO) {
  return supabase
    .from('events')
    .delete()
    .eq('series_id', seriesId)
    .gte('start_time', fromISO)
}

/* ---------------- Handoff notes ---------------- */

export async function fetchNotesForGroup(groupId) {
  // Notes for all events in the group, newest first, with author + event time.
  const { data, error } = await supabase
    .from('event_notes')
    .select(
      'id, content, created_at, author_id, ' +
        'author:profiles(display_name, email, avatar_initials), ' +
        'event:events!inner(id, group_id, start_time, end_time)'
    )
    .eq('event.group_id', groupId)
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}

export async function fetchNotesForEvent(eventId) {
  return supabase
    .from('event_notes')
    .select('id, content, created_at, author_id, author:profiles(display_name, email, avatar_initials)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
}

export async function addNote(eventId, authorId, content) {
  return supabase
    .from('event_notes')
    .insert({ event_id: eventId, author_id: authorId, content })
    .select('id, content, created_at, author_id')
    .single()
}

export async function deleteNote(noteId) {
  return supabase.from('event_notes').delete().eq('id', noteId)
}

/* ---------------- Tasks ---------------- */

export async function fetchTasks(groupId) {
  return supabase
    .from('tasks')
    .select(
      'id, title, is_shared, is_complete, assigned_user_id, created_at, ' +
        'assignee:profiles!tasks_assigned_user_id_fkey(display_name, email, avatar_initials)'
    )
    .eq('group_id', groupId)
    .order('is_complete', { ascending: true })
    .order('created_at', { ascending: false })
}

export async function createTask(task) {
  return supabase.from('tasks').insert(task).select().single()
}

export async function setTaskComplete(taskId, isComplete) {
  return supabase.from('tasks').update({ is_complete: isComplete }).eq('id', taskId)
}

export async function deleteTask(taskId) {
  return supabase.from('tasks').delete().eq('id', taskId)
}
