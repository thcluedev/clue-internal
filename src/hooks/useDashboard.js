import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useDashboard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const [
        opps, quotes, projects, contacts,
        oppsCount, companiesCount, quotesCount, projectsCount,
      ] = await Promise.all([
        supabase
          .from('opportunities')
          .select('id, title, stage, amount, currency, created_at, companies(name)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('quotes')
          .select('id, number, status, currency, items, created_at, companies(name)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('projects')
          .select('id, name, status, created_at, companies(name), tasks(id, stage)')
          .eq('status', 'activo')
          .order('created_at', { ascending: false })
          .limit(4),
        supabase
          .from('companies')
          .select('id, name, type, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('opportunities')
          .select('id', { count: 'exact' })
          .not('stage', 'in', '(cerrado,perdido)'),
        supabase
          .from('companies')
          .select('id', { count: 'exact' }),
        supabase
          .from('quotes')
          .select('id', { count: 'exact' })
          .eq('status', 'enviada'),
        supabase
          .from('projects')
          .select('id', { count: 'exact' })
          .eq('status', 'activo'),
      ])

      setData({
        recentOpps:          opps.data          || [],
        recentQuotes:        quotes.data        || [],
        activeProjects:      projects.data      || [],
        recentContacts:      contacts.data      || [],
        openOppsCount:       oppsCount.count    ?? 0,
        companiesCount:      companiesCount.count ?? 0,
        pendingQuotesCount:  quotesCount.count  ?? 0,
        activeProjectsCount: projectsCount.count ?? 0,
      })
      setLoading(false)
    }
    fetchAll()
  }, [])

  return { data, loading }
}
