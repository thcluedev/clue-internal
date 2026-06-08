import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useQuotes() {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('quotes')
      .select('*, companies(id, name, email), opportunities(id, title)')
      .order('created_at', { ascending: false })
    setQuotes(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchQuotes() }, [fetchQuotes])

  const createQuote = async (payload) => {
    const { data, error } = await supabase
      .from('quotes')
      .insert(payload)
      .select()
      .single()
    if (!error) fetchQuotes()
    return { data, error }
  }

  const updateQuote = async (id, payload) => {
    const { error } = await supabase.from('quotes').update(payload).eq('id', id)
    if (!error) fetchQuotes()
    return { error }
  }

  const deleteQuote = async (id) => {
    const { error } = await supabase.from('quotes').delete().eq('id', id)
    if (!error) fetchQuotes()
    return { error }
  }

  return { quotes, loading, createQuote, updateQuote, deleteQuote, refetch: fetchQuotes }
}
