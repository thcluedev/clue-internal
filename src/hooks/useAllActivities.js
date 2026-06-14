import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAllActivities({ onlyMine = true, userId = null } = {}) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    if (onlyMine && !userId) {
      setLoading(true)
      return
    }
    setLoading(true)
    let query = supabase
      .from('activities')
      .select(`
        *,
        profiles!activities_assigned_to_fkey(full_name, initials, avatar_color),
        opportunities(id, title, companies(name))
      `)
      .eq('done', false)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (onlyMine && userId) {
      query = query.eq('assigned_to', userId)
    }

    const { data } = await query
    setActivities(data || [])
    setLoading(false)
  }, [onlyMine, userId])

  useEffect(() => { fetchActivities() }, [fetchActivities])

  const reschedule = async (id, newDate) => {
    const { error } = await supabase
      .from('activities')
      .update({ due_date: newDate })
      .eq('id', id)
    if (!error) fetchActivities()
    return { error }
  }

  const toggleDone = async (id) => {
    const { error } = await supabase
      .from('activities')
      .update({ done: true })
      .eq('id', id)
    if (!error) fetchActivities()
    return { error }
  }

  const today = new Date().toISOString().split('T')[0]

  const overdue  = activities.filter(a => a.due_date && a.due_date < today)
  const dueToday = activities.filter(a => a.due_date === today)
  const upcoming = activities.filter(a => a.due_date && a.due_date > today)
  const noDate   = activities.filter(a => !a.due_date)

  return {
    activities, loading,
    overdue, dueToday, upcoming, noDate,
    reschedule, toggleDone, refetch: fetchActivities,
  }
}
