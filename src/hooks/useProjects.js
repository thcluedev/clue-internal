import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*, companies(id, name), tasks(id, stage)')
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const createProject = async (payload) => {
    const { error } = await supabase.from('projects').insert(payload)
    if (!error) fetchProjects()
    return { error }
  }

  const updateProject = async (id, payload) => {
    const { error } = await supabase.from('projects').update(payload).eq('id', id)
    if (!error) fetchProjects()
    return { error }
  }

  const deleteProject = async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) fetchProjects()
    return { error }
  }

  return { projects, loading, createProject, updateProject, deleteProject, refetch: fetchProjects }
}
