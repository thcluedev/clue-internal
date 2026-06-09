import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useProjectTasks(projectId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true })
    setTasks(data || [])
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const createTask = async (payload) => {
    const { error } = await supabase
      .from('tasks')
      .insert({ ...payload, project_id: projectId })
    if (!error) fetchTasks()
    return { error }
  }

  const updateTask = async (id, payload) => {
    const { error } = await supabase.from('tasks').update(payload).eq('id', id)
    if (!error) fetchTasks()
    return { error }
  }

  const deleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) fetchTasks()
    return { error }
  }

  const byColumn = (col) => tasks.filter(t => t.column === col)

  return { tasks, loading, byColumn, createTask, updateTask, deleteTask, refetch: fetchTasks }
}
