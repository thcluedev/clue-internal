import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOpportunities = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('opportunities')
      .select('*, companies(id, name)')
      .order('position', { ascending: true })
    setOpportunities(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchOpportunities() }, [fetchOpportunities])

  const createOpportunity = async (payload) => {
    const { error } = await supabase.from('opportunities').insert(payload)
    if (!error) fetchOpportunities()
    return { error }
  }

  const updateOpportunity = async (id, payload) => {
    const { error } = await supabase.from('opportunities').update(payload).eq('id', id)
    if (!error) fetchOpportunities()
    return { error }
  }

  const deleteOpportunity = async (id) => {
    const { error } = await supabase.from('opportunities').delete().eq('id', id)
    if (!error) fetchOpportunities()
    return { error }
  }

  const byStage = (stage) => opportunities.filter(o => o.stage === stage)

  return {
    opportunities,
    loading,
    byStage,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    refetch: fetchOpportunities,
  }
}
