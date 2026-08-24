import { supabase } from './supabaseClient'

/* ---------------- Groups & members ---------------- */

export async function createGroup(name) {
  return supabase.rpc('create_group', { group_name: name })
}

export async function fetchGroupMembers(groupId) {
  // group_members joined to profiles for display names + initials.
  const { data, error } = await supabase
    .from('group_members')
    .select('user_id, joined_at, profile:profiles(id, display_name, email, avatar_initials)')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })
  if (error) return { data: [], error }
  const members = (data || []).map((row) => ({
    userId: row.user_id,
    joinedAt: row.joined_at,
    name: row.profile?.display_name || row.profile?.email || 'Member',
    email: row.profile?.email || '',
    initials: row.profile?.avatar_initials || null,
  }))
  return { data: members, error: null }
}

export async function removeMember(groupId, userId) {
  return supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
}

export async function updateGroupSetting(groupId, patch) {
  return supabase.from('groups').update(patch).eq('id', groupId)
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

/* ---------------- Shifts ---------------- */

export async function fetchShifts(groupId) {
  return supabase
    .from('shifts')
    .select('*')
    .eq('group_id', groupId)
    .order('start_time', { ascending: true })
}

export async function createShift(shift) {
  return supabase.from('shifts').insert(shift).select().single()
}

export async function claimShift(shiftId, userId) {
  return supabase.from('shifts').update({ assigned_user_id: userId }).eq('id', shiftId)
}

export async function releaseShift(shiftId) {
  return supabase.from('shifts').update({ assigned_user_id: null }).eq('id', shiftId)
}

export async function deleteShift(shiftId) {
  return supabase.from('shifts').delete().eq('id', shiftId)
}

/* ---------------- Handoff notes ---------------- */

export async function fetchNotesForGroup(groupId) {
  // Notes for all shifts in the group, newest first, with author + shift time.
  const { data, error } = await supabase
    .from('shift_notes')
    .select(
      'id, content, created_at, author_id, ' +
        'author:profiles(display_name, email, avatar_initials), ' +
        'shift:shifts!inner(id, group_id, start_time, end_time)'
    )
    .eq('shift.group_id', groupId)
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}

export async function fetchNotesForShift(shiftId) {
  return supabase
    .from('shift_notes')
    .select('id, content, created_at, author_id, author:profiles(display_name, email, avatar_initials)')
    .eq('shift_id', shiftId)
    .order('created_at', { ascending: true })
}

export async function addNote(shiftId, authorId, content) {
  return supabase
    .from('shift_notes')
    .insert({ shift_id: shiftId, author_id: authorId, content })
    .select('id, content, created_at, author_id')
    .single()
}

export async function deleteNote(noteId) {
  return supabase.from('shift_notes').delete().eq('id', noteId)
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
