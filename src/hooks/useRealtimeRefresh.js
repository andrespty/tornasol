import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Subscribe to Postgres changes on a table and call `onChange` whenever a row
 * changes. Used so shifts, tasks, and notes update live for every family
 * member without a manual refresh.
 *
 * @param {string} table      Table to watch (e.g. 'shifts').
 * @param {object} opts
 * @param {string} [opts.filter]   PostgREST filter, e.g. `group_id=eq.<id>`.
 * @param {string} opts.channelKey Unique channel name.
 * @param {boolean} [opts.enabled] Skip subscribing when false.
 * @param {Function} onChange      Called on any matching change.
 */
export function useRealtimeRefresh(table, { filter, channelKey, enabled = true }, onChange) {
  useEffect(() => {
    if (!enabled || !channelKey) return undefined

    const config = { event: '*', schema: 'public', table }
    if (filter) config.filter = filter

    const channel = supabase
      .channel(channelKey)
      .on('postgres_changes', config, () => onChange())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, channelKey, enabled])
}
