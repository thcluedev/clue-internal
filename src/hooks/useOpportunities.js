import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const STAGE_CONFIG = {
  calificado:           { label: 'Calificado',          color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  pendiente_presupuesto:{ label: 'Pte. a presupuestar', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  cotizado:             { label: 'Cotizado',            color: '#b4821e', bg: 'rgba(180,130,40,0.12)'  },
  negociacion:          { label: 'Negociación',         color: '#0d9488', bg: 'rgba(13,148,136,0.12)' },
  ganado:               { label: 'Ganado',              color: '#4a9a5a', bg: 'rgba(74,154,90,0.12)'   },
  facturado:            { label: 'Facturado',           color: '#4a9a5a', bg: 'rgba(74,154,90,0.08)'   },
  perdido:              { label: 'Perdido',             color: '#9a4a4a', bg: 'rgba(154,74,74,0.12)'   },
}

export const STAGE_ORDER = [
  'calificado','pendiente_presupuesto','cotizado',
  'negociacion','ganado','facturado','perdido',
]

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOpportunities = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('opportunities')
      .select('*, companies(id, name), activities(id, done)')
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

  const changeStage = async (opp, newStage) => {
    // Validate cotizado: needs amount AND a linked quote with status 'enviada'
    if (newStage === 'cotizado') {
      if (!opp.amount || Number(opp.amount) <= 0)
        return { error: 'La oportunidad debe tener un monto antes de pasar a Cotizado.' }
      const { data: qs } = await supabase.from('quotes').select('id')
        .eq('opportunity_id', opp.id).eq('status', 'enviada').limit(1)
      if (!qs?.length)
        return { error: 'Se requiere una cotización con estado "enviada" vinculada a esta oportunidad.' }
    }

    // Validate ganado: needs a linked quote with status 'aceptada'
    if (newStage === 'ganado') {
      const { data: qs } = await supabase.from('quotes').select('id')
        .eq('opportunity_id', opp.id).eq('status', 'aceptada').limit(1)
      if (!qs?.length)
        return { error: 'Se requiere una cotización con estado "aceptada" vinculada a esta oportunidad.' }
    }

    // Facturado: prompt for invoice number
    if (newStage === 'facturado') {
      const nroFactura = window.prompt('Ingresá el número de factura:')
      if (!nroFactura?.trim())
        return { error: 'Se requiere número de factura para marcar como Facturado.' }
      const { error } = await supabase
        .from('opportunities')
        .update({ nro_factura: nroFactura.trim(), stage: newStage })
        .eq('id', opp.id)
      if (!error) fetchOpportunities()
      return { error: error?.message || null }
    }

    const { error } = await supabase
      .from('opportunities')
      .update({ stage: newStage })
      .eq('id', opp.id)

    if (!error && newStage === 'pendiente_presupuesto' && opp.assigned_to) {
      await supabase.functions.invoke('notify-activity', {
        body: { type: 'estimacion_pendiente', opportunityId: opp.id, assignedTo: opp.assigned_to }
      })
    }

    if (!error) fetchOpportunities()
    return { error: error?.message || null }
  }

  const byStage = (stage) => opportunities.filter(o => o.stage === stage)

  return {
    opportunities,
    loading,
    byStage,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    changeStage,
    refetch: fetchOpportunities,
  }
}
