import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useActivities(opportunityId) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    if (!opportunityId) {
      setActivities([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('activities')
      .select('*, profiles!activities_assigned_to_fkey(full_name, initials, avatar_color)')
      .eq('opportunity_id', opportunityId)
      .order('done', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    setActivities(data || [])
    setLoading(false)
  }, [opportunityId])

  useEffect(() => { fetchActivities() }, [fetchActivities])

  const createActivity = async (payload) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('activities')
      .insert({ ...payload, opportunity_id: opportunityId, created_by: user.id })
      .select()
      .single()

    if (!error && data && payload.assigned_to && payload.assigned_to !== user.id) {
      await supabase.functions.invoke('notify-activity', {
        body: { activityId: data.id },
      })
    }

    if (!error) fetchActivities()
    return { error }
  }

  const toggleDone = async (id, currentDone) => {
    const { error } = await supabase
      .from('activities')
      .update({ done: !currentDone })
      .eq('id', id)
    if (!error) fetchActivities()
    return { error }
  }

  const deleteActivity = async (id) => {
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (!error) fetchActivities()
    return { error }
  }

  const pending = activities.filter(a => !a.done)
  const done    = activities.filter(a => a.done)

  return { activities, pending, done, loading, createActivity, toggleDone, deleteActivity, refetch: fetchActivities }
}
