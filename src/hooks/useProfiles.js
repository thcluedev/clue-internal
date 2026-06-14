import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProfiles() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })
      setProfiles(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const getProfile  = (id) => profiles.find(p => p.id === id) || null
  const getName     = (id) => getProfile(id)?.full_name    || '—'
  const getInitials = (id) => getProfile(id)?.initials     || '?'
  const getColor    = (id) => getProfile(id)?.avatar_color || '#9a9489'

  return { profiles, loading, getProfile, getName, getInitials, getColor }
}
