import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCompanies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('companies')
      .select(`*, contacts(*)`)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setCompanies(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCompanies() }, [fetchCompanies])

  const createCompany = async (payload) => {
    const { error } = await supabase.from('companies').insert(payload)
    if (!error) fetchCompanies()
    return { error }
  }

  const updateCompany = async (id, payload) => {
    const { error } = await supabase.from('companies').update(payload).eq('id', id)
    if (!error) fetchCompanies()
    return { error }
  }

  const deleteCompany = async (id) => {
    const { error } = await supabase.from('companies').delete().eq('id', id)
    if (!error) fetchCompanies()
    return { error }
  }

  const createContact = async (payload) => {
    const { error } = await supabase.from('contacts').insert(payload)
    if (!error) fetchCompanies()
    return { error }
  }

  const deleteContact = async (id) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (!error) fetchCompanies()
    return { error }
  }

  return {
    companies,
    loading,
    error,
    createCompany,
    updateCompany,
    deleteCompany,
    createContact,
    deleteContact,
    refetch: fetchCompanies,
  }
}
