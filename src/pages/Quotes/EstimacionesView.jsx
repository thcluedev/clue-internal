import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Button, Card, Input, Textarea, ProfileAvatar } from '../../components/ui'

const SERVICE_STYLE = {
  odoo:      { background: 'rgba(59,130,246,0.22)',  border: '1px solid rgba(59,130,246,0.44)',  color: '#60a5fa' },
  sistemas:  { background: 'rgba(139,92,246,0.22)',  border: '1px solid rgba(139,92,246,0.44)',  color: '#a78bfa' },
  web:       { background: 'rgba(232,76,30,0.22)',   border: '1px solid rgba(232,76,30,0.44)',   color: '#fb7c52' },
  ecommerce: { background: 'rgba(72,187,100,0.22)',  border: '1px solid rgba(72,187,100,0.44)',  color: '#6dd68a' },
}

function daysAgo(dateStr) {
  if (!dateStr) return null
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'hoy'
  if (diff === 1) return 'hace 1 día'
  return `hace ${diff} días`
}

const EMPTY_ESTIM = { horas: '', monto: '', currency: 'ARS', notas: '' }

export function EstimacionesView() {
  const [onlyMine, setOnlyMine]       = useState(true)
  const [opps, setOpps]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [expandedId, setExpandedId]   = useState(null)
  const [estims, setEstims]           = useState({})
  const [saving, setSaving]           = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setCurrentUser(user) })
  }, [])

  const fetchOpps = useCallback(async () => {
    if (onlyMine && !currentUser?.id) return
    setLoading(true)
    let q = supabase
      .from('opportunities')
      .select('*, companies(id, name)')
      .eq('stage', 'pendiente_presupuesto')
      .order('updated_at', { ascending: true })
    if (onlyMine && currentUser?.id) q = q.eq('assigned_to', currentUser.id)
    const { data } = await q
    setOpps(data || [])
    setLoading(false)
  }, [onlyMine, currentUser?.id])

  useEffect(() => { fetchOpps() }, [fetchOpps])

  const getEstim  = (id) => estims[id] || { ...EMPTY_ESTIM }
  const setEstimField = (id, key, val) => setEstims(e => ({ ...e, [id]: { ...getEstim(id), [key]: val } }))

  const handleSubmit = async (opp) => {
    const estim = getEstim(opp.id)
    if (!estim.horas || !estim.monto) return
    setSaving(opp.id)
    const { error } = await supabase.from('opportunities').update({
      estimacion_tecnica: Number(estim.monto),
      estimacion_horas:   Number(estim.horas),
      estimacion_notas:   estim.notas || null,
      estimacion_by:      currentUser.id,
    }).eq('id', opp.id)

    if (!error) {
      await supabase.functions.invoke('notify-activity', {
        body: {
          type: 'estimacion_lista',
          opportunityId: opp.id,
          devId: currentUser.id,
          horas: estim.horas,
          monto: estim.monto,
          currency: estim.currency,
          notas: estim.notas,
        }
      })
      fetchOpps()
      setExpandedId(null)
    }
    setSaving(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Controls */}
      <Card style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Estimaciones pendientes
          </span>
          {opps.length > 0 && (
            <span style={{ background: 'rgba(232,76,30,0.16)', border: '1px solid rgba(232,76,30,0.34)', borderRadius: '100px', padding: '1px 8px', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ember)' }}>
              {opps.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button variant={onlyMine ? 'primary' : 'ghost'} size="sm" onClick={() => setOnlyMine(true)}>Mis pendientes</Button>
          <Button variant={!onlyMine ? 'primary' : 'ghost'} size="sm" onClick={() => setOnlyMine(false)}>Todas</Button>
        </div>
      </Card>

      {/* Cards */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone)', letterSpacing: '0.08em' }}>
            CARGANDO...
          </div>
        ) : opps.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', padding: '3rem' }}>
            <span style={{ fontSize: '32px' }}>✓</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--stone)', textAlign: 'center' }}>
              {onlyMine ? 'No tenés estimaciones pendientes.' : 'No hay estimaciones pendientes.'}
            </span>
          </div>
        ) : opps.map(opp => {
          const isExpanded = expandedId === opp.id
          const svc        = SERVICE_STYLE[opp.service]
          const estim      = getEstim(opp.id)

          return (
            <Card key={opp.id} style={{ padding: 0, overflow: 'hidden' }}>
              {/* Card header — clickable */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    {opp.service && svc && (
                      <span style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', padding: '2px 8px', borderRadius: '100px', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', ...svc }}>
                        {opp.service}
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: 'var(--off-white)', fontWeight: 400 }}>
                      {opp.title}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)' }}>
                      {opp.companies?.name || '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                    <ProfileAvatar userId={opp.assigned_to} size="xs" />
                    {opp.updated_at && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)' }}>
                        {daysAgo(opp.updated_at)}
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)' }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
                {opp.notes && (
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--stone)', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                    {opp.notes}
                  </div>
                )}
              </div>

              {/* Expandable estimation form */}
              {isExpanded && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    Cargar estimación
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ flex: '0 0 130px' }}>
                      <Input
                        label="Horas estimadas *"
                        type="number"
                        placeholder="0"
                        value={estim.horas}
                        onChange={e => setEstimField(opp.id, 'horas', e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Input
                        label="Monto técnico sugerido *"
                        type="number"
                        placeholder="0"
                        value={estim.monto}
                        onChange={e => setEstimField(opp.id, 'monto', e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '4px', paddingBottom: '1px' }}>
                      {['ARS','USD'].map(c => (
                        <Button
                          key={c}
                          variant={estim.currency === c ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => setEstimField(opp.id, 'currency', c)}
                        >
                          {c}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    label="Notas para Ventas"
                    placeholder="Qué incluye la estimación, qué no, advertencias..."
                    value={estim.notas}
                    onChange={e => setEstimField(opp.id, 'notas', e.target.value)}
                    resize={false}
                    minHeight="70px"
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => setExpandedId(null)}>Cancelar</Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!estim.horas || !estim.monto || saving === opp.id}
                      loading={saving === opp.id}
                      onClick={() => handleSubmit(opp)}
                    >
                      Enviar estimación a Ventas
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
