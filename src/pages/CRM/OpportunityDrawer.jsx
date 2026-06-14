import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Badge, Select, Textarea, UserSelect, ProfileAvatar } from '../../components/ui'
import { useCompanies } from '../../hooks/useCompanies'
import { useActivities } from '../../hooks/useActivities'
import { STAGE_CONFIG, STAGE_ORDER } from '../../hooks/useOpportunities'
import { supabase } from '../../lib/supabase'
import styles from './CRM.module.css'

const STAGE_OPTIONS = STAGE_ORDER.map(id => ({ value: id, label: STAGE_CONFIG[id].label }))

function getStageStyle(stage) {
  const c = STAGE_CONFIG[stage]
  if (!c) return {}
  return { background: c.bg, border: `1px solid ${c.color}55`, color: c.color }
}

const SERVICE_OPTIONS = [
  { value: 'odoo',      label: 'Odoo' },
  { value: 'sistemas',  label: 'Sistemas' },
  { value: 'web',       label: 'Web' },
  { value: 'ecommerce', label: 'E-commerce' },
]

function SectionTitle({ children, id }) {
  return (
    <div
      id={id}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        color: 'var(--stone)',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {children}
    </div>
  )
}

/* ── Activity helpers ───────────────────────────────────────── */
const ACTIVITY_TYPE_OPTIONS = [
  { value: 'llamada',                    label: 'Llamada' },
  { value: 'reunion',                    label: 'Reunión' },
  { value: 'mail',                       label: 'Mail' },
  { value: 'tarea',                      label: 'Tarea' },
  { value: 'seguimiento_normal',         label: '🔄 Seguimiento normal' },
  { value: 'seguimiento_interesado',     label: '🟢 Seguimiento interesado' },
  { value: 'seguimiento_no_interesado',  label: '🔴 Seguimiento no interesado' },
  { value: 'otro',                       label: 'Otro' },
]

const ACTIVITY_TYPE_ICONS = {
  llamada:                   '📞',
  reunion:                   '👥',
  mail:                      '✉️',
  tarea:                     '✓',
  seguimiento_normal:        '🔄',
  seguimiento_interesado:    '🟢',
  seguimiento_no_interesado: '🔴',
  otro:                      '·',
}

const EMPTY_ACTIVITY_FORM = { type: 'llamada', title: '', assigned_to: '', due_date: '', notes: '' }

function isDateOverdue(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d <= today
}

function formatShortDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
}

/* ── ActivitiesSection ─────────────────────────────────────── */
function ActivitiesSection({ opportunityId }) {
  const { pending, done: doneActivities, loading, createActivity, toggleDone, deleteActivity } = useActivities(opportunityId)

  const [showForm,    setShowForm]    = useState(false)
  const [form,        setForm]        = useState({ ...EMPTY_ACTIVITY_FORM })
  const [titleError,  setTitleError]  = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [showNotes,   setShowNotes]   = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [fadingIds,   setFadingIds]   = useState(new Set())
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
  }, [])

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const openForm = () => {
    setForm({ ...EMPTY_ACTIVITY_FORM, assigned_to: currentUserId || '' })
    setTitleError(false)
    setShowNotes(false)
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setForm(EMPTY_ACTIVITY_FORM)
    setShowNotes(false)
    setTitleError(false)
  }

  const handleCreate = async () => {
    if (!form.title.trim()) { setTitleError(true); return }
    setTitleError(false)
    setSaving(true)
    const { error } = await createActivity({
      type:        form.type,
      title:       form.title.trim(),
      assigned_to: form.assigned_to || null,
      due_date:    form.due_date    || null,
      notes:       form.notes       || null,
    })
    if (!error) cancelForm()
    setSaving(false)
  }

  const handleToggleDone = (id, currentDone) => {
    if (!currentDone) {
      setFadingIds(prev => new Set([...prev, id]))
      setTimeout(async () => {
        await toggleDone(id, false)
        setFadingIds(prev => { const s = new Set(prev); s.delete(id); return s })
      }, 340)
    } else {
      toggleDone(id, true)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Actividades
        </span>
        {pending.length > 0 && (
          <span className={styles.actCount}>{pending.length}</span>
        )}
        <button
          onClick={showForm ? cancelForm : openForm}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '100px',
            padding: '2px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--stone)',
            cursor: 'pointer',
            letterSpacing: '0.06em',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--off-white)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--stone)';     e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
        >
          {showForm ? 'Cancelar' : '+ Agregar'}
        </button>
      </div>

      {/* Inline add form */}
      {showForm && (
        <div className={styles.actForm}>
          <div className={styles.actFormRow}>
            <div style={{ flex: '0 0 136px' }}>
              <Select
                value={form.type}
                onChange={val => setField('type', val)}
                options={ACTIVITY_TYPE_OPTIONS}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Input
                placeholder="Título *"
                value={form.title}
                onChange={e => { setField('title', e.target.value); setTitleError(false) }}
                error={titleError ? 'Requerido' : undefined}
              />
            </div>
          </div>
          <div className={styles.actFormRow}>
            <div style={{ flex: 1 }}>
              <UserSelect
                value={form.assigned_to}
                onChange={val => setField('assigned_to', val)}
              />
            </div>
            <div style={{ flex: '0 0 148px' }}>
              <Input
                type="date"
                value={form.due_date}
                onChange={e => setField('due_date', e.target.value)}
              />
            </div>
          </div>
          {!showNotes ? (
            <button className={styles.actNotesToggle} onClick={() => setShowNotes(true)}>
              + agregar nota
            </button>
          ) : (
            <Textarea
              placeholder="Nota..."
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              resize={false}
              minHeight="70px"
            />
          )}
          <div className={styles.actFormActions}>
            <Button variant="ghost" size="sm" onClick={cancelForm}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving} loading={saving}>
              Agregar actividad
            </Button>
          </div>
        </div>
      )}

      {/* Pending list */}
      {loading ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)', padding: '8px 0' }}>
          Cargando...
        </div>
      ) : pending.length === 0 ? (
        <div className={styles.actEmptyState}>Sin actividades pendientes.</div>
      ) : (
        <div className={styles.actList}>
          {pending.map(act => {
            const overdue  = isDateOverdue(act.due_date)
            const dateText = formatShortDate(act.due_date)
            const fading   = fadingIds.has(act.id)
            return (
              <div key={act.id} className={`${styles.actRow} ${fading ? styles.actRowFading : ''}`}>
                <button
                  className={styles.actCheckbox}
                  onClick={() => handleToggleDone(act.id, act.done)}
                  title="Marcar como completada"
                />
                <span className={styles.actIcon}>{ACTIVITY_TYPE_ICONS[act.type] || '·'}</span>
                <div className={styles.actContent}>
                  <span className={styles.actTitle}>{act.title}</span>
                  {dateText && (
                    <span className={`${styles.actDate} ${overdue ? styles.actDateOverdue : ''}`}>
                      {dateText}
                    </span>
                  )}
                </div>
                <ProfileAvatar userId={act.assigned_to} size="xs" />
                <div className={styles.actRowHoverActions}>
                  <button
                    className={styles.actDeleteBtn}
                    onClick={() => deleteActivity(act.id)}
                    title="Eliminar"
                  >×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Completed history */}
      {doneActivities.length > 0 && (
        <>
          <button className={styles.actHistoryToggle} onClick={() => setShowHistory(h => !h)}>
            {showHistory ? '▲' : '▼'} Ver historial ({doneActivities.length})
          </button>
          {showHistory && (
            <div className={styles.actList}>
              {doneActivities.map(act => (
                <div key={act.id} className={`${styles.actRow} ${styles.actRowDone}`}>
                  <button
                    className={`${styles.actCheckbox} ${styles.actCheckboxDone}`}
                    onClick={() => handleToggleDone(act.id, act.done)}
                    title="Marcar como pendiente"
                  >
                    <span className={styles.actCheckmarkIcon}>✓</span>
                  </button>
                  <span className={styles.actIcon}>{ACTIVITY_TYPE_ICONS[act.type] || '·'}</span>
                  <div className={styles.actContent}>
                    <span className={`${styles.actTitle} ${styles.actTitleDone}`}>{act.title}</span>
                    {act.done_at && (
                      <span className={styles.actDate}>{formatShortDate(act.done_at)}</span>
                    )}
                  </div>
                  <div className={styles.actRowHoverActions}>
                    <button
                      className={styles.actDeleteBtn}
                      onClick={() => deleteActivity(act.id)}
                      title="Eliminar"
                    >×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Opportunity form ───────────────────────────────────────── */
const EMPTY_FORM = {
  title: '',
  company_id: null,
  stage: 'calificado',
  service: 'odoo',
  amount: '',
  currency: 'ARS',
  assigned_to: '',
  close_date: '',
  notes: '',
  nro_factura: '',
}

export function OpportunityDrawer({ isOpen, onClose, opportunity, onCreate, onUpdate, onDelete }) {
  const isCreate = isOpen && opportunity === null
  const { companies } = useCompanies()
  const navigate = useNavigate()

  const companyOptions = companies.map(c => ({ value: c.id, label: c.name }))

  const [editing, setEditing]       = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [titleError, setTitleError] = useState(false)
  const [stageError, setStageError] = useState(null)
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm(opportunity ? {
        title:       opportunity.title || '',
        company_id:  opportunity.company_id || null,
        stage:       opportunity.stage || 'calificado',
        service:     opportunity.service || 'odoo',
        amount:      opportunity.amount ?? '',
        currency:    opportunity.currency || 'ARS',
        assigned_to: opportunity.assigned_to || '',
        close_date:  opportunity.close_date || '',
        notes:       opportunity.notes || '',
        nro_factura: opportunity.nro_factura || '',
      } : EMPTY_FORM)
    }
    setEditing(false)
    setTitleError(false)
    setStageError(null)
  }, [opportunity, isOpen])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.title.trim()) { setTitleError(true); return }
    setStageError(null)

    if (!isCreate && opportunity) {
      const stageChanged = form.stage !== opportunity.stage
      if (stageChanged) {
        if (form.stage === 'cotizado') {
          if (!form.amount || Number(form.amount) <= 0) {
            setStageError('Se requiere monto para pasar a Cotizado.')
            return
          }
          const { data: qs } = await supabase.from('quotes').select('id')
            .eq('opportunity_id', opportunity.id).eq('status', 'enviada').limit(1)
          if (!qs?.length) {
            setStageError('Se requiere una cotización con estado "enviada" vinculada.')
            return
          }
        }
        if (form.stage === 'ganado') {
          const { data: qs } = await supabase.from('quotes').select('id')
            .eq('opportunity_id', opportunity.id).eq('status', 'aceptada').limit(1)
          if (!qs?.length) {
            setStageError('Se requiere una cotización con estado "aceptada" vinculada.')
            return
          }
        }
        if (form.stage === 'facturado' && !form.nro_factura?.trim()) {
          setStageError('Se requiere número de factura para marcar como Facturado.')
          return
        }
        if (form.stage === 'perdido' && !form.notes?.trim()) {
          setStageError('Se requiere una razón de pérdida en las notas.')
          return
        }
      }
    }

    setTitleError(false)
    setSaving(true)
    const payload = {
      ...form,
      amount:      form.amount === '' ? null : Number(form.amount),
      company_id:  form.company_id  || null,
      close_date:  form.close_date  || null,
      assigned_to: form.assigned_to || null,
      notes:       form.notes       || null,
      nro_factura: form.nro_factura || null,
    }
    if (isCreate) {
      const { error } = await onCreate(payload)
      if (!error) onClose()
    } else {
      await onUpdate(opportunity.id, payload)
      setEditing(false)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar la oportunidad "${opportunity.title}"?\nEsta acción no se puede deshacer.`)) return
    await onDelete(opportunity.id)
    onClose()
  }

  const cancelEdit = () => {
    setEditing(false)
    setTitleError(false)
    setStageError(null)
    if (opportunity) {
      setForm({
        title:       opportunity.title || '',
        company_id:  opportunity.company_id || null,
        stage:       opportunity.stage || 'calificado',
        service:     opportunity.service || 'odoo',
        amount:      opportunity.amount ?? '',
        currency:    opportunity.currency || 'ARS',
        assigned_to: opportunity.assigned_to || '',
        close_date:  opportunity.close_date || '',
        notes:       opportunity.notes || '',
        nro_factura: opportunity.nro_factura || '',
      })
    }
  }

  const stageStyle = getStageStyle(opportunity?.stage)
  const stageLabel = STAGE_CONFIG[opportunity?.stage]?.label || ''

  const CurrencyToggle = () => (
    <div style={{ display: 'flex', gap: '6px' }}>
      <Button variant={form.currency === 'ARS' ? 'primary' : 'ghost'} size="sm" onClick={() => setField('currency', 'ARS')}>ARS</Button>
      <Button variant={form.currency === 'USD' ? 'primary' : 'ghost'} size="sm" onClick={() => setField('currency', 'USD')}>USD</Button>
    </div>
  )

  return (
    <>
      {/* Overlay */}
      <div
        id="opp-drawer-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s',
        }}
      />

      {/* Drawer */}
      <div
        id="opp-drawer"
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : styles.drawerClosed}`}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isCreate ? (
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 500, color: 'var(--off-white)' }}>
                Nueva oportunidad
              </h2>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 500, color: 'var(--off-white)', wordBreak: 'break-word' }}>
                  {opportunity?.title}
                </h2>
                {opportunity?.stage && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    padding: '3px 10px',
                    borderRadius: '100px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    ...stageStyle,
                  }}>
                    {stageLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {!isCreate && !editing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Editar</Button>
            )}
            <Button
              variant="icon"
              size="sm"
              onClick={onClose}
              style={{ width: '32px', height: '32px', fontSize: '18px' }}
            >
              ×
            </Button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>

          {/* ── CREATE MODE ── */}
          {isCreate && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <Input
                  id="opp-create-title"
                  placeholder="Nombre de la oportunidad *"
                  value={form.title}
                  onChange={e => { setField('title', e.target.value); setTitleError(false) }}
                  error={titleError ? 'El título es requerido' : undefined}
                />
                <Select
                  id="opp-create-company"
                  placeholder="Empresa"
                  value={form.company_id}
                  onChange={val => setField('company_id', val)}
                  options={[{ value: null, label: 'Sin empresa' }, ...companyOptions]}
                />
                <Select
                  id="opp-create-service"
                  value={form.service}
                  onChange={val => setField('service', val)}
                  options={SERVICE_OPTIONS}
                />
                <Select
                  id="opp-create-stage"
                  value={form.stage}
                  onChange={val => setField('stage', val)}
                  options={STAGE_OPTIONS}
                />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <Input
                    id="opp-create-amount"
                    type="number"
                    placeholder="Monto"
                    value={form.amount}
                    onChange={e => setField('amount', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <CurrencyToggle />
                </div>
                <UserSelect
                  id="opp-create-assigned_to"
                  value={form.assigned_to}
                  onChange={val => setField('assigned_to', val)}
                />
                <Input
                  id="opp-create-closedate"
                  type="date"
                  label="Fecha de cierre"
                  value={form.close_date}
                  onChange={e => setField('close_date', e.target.value)}
                />
                <Textarea
                  id="opp-create-notes"
                  placeholder="Notas..."
                  value={form.notes}
                  onChange={e => setField('notes', e.target.value)}
                  resize={false}
                  minHeight="90px"
                />
              </div>

              <Button
                id="opp-btn-create"
                variant="primary"
                onClick={handleSave}
                disabled={saving}
                loading={saving}
                fullWidth
              >
                Crear oportunidad
              </Button>
            </>
          )}

          {/* ── VIEW / EDIT MODE ── */}
          {!isCreate && opportunity && (
            <>
              {/* Empresa */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <SectionTitle>Empresa</SectionTitle>
                {editing ? (
                  <Select
                    id="opp-edit-company"
                    value={form.company_id}
                    onChange={val => setField('company_id', val)}
                    options={[{ value: null, label: 'Sin empresa' }, ...companyOptions]}
                  />
                ) : (
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: opportunity.companies?.name ? 'var(--off-white)' : 'var(--stone)' }}>
                    {opportunity.companies?.name || '—'}
                  </div>
                )}
              </div>

              {/* Oportunidad */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <SectionTitle>Oportunidad</SectionTitle>
                {editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <Input
                      id="opp-edit-title"
                      placeholder="Título *"
                      value={form.title}
                      onChange={e => { setField('title', e.target.value); setTitleError(false) }}
                      error={titleError ? 'El título es requerido' : undefined}
                    />
                    <Select
                      id="opp-edit-service"
                      value={form.service}
                      onChange={val => setField('service', val)}
                      options={SERVICE_OPTIONS}
                    />
                    <Select
                      id="opp-edit-stage"
                      value={form.stage}
                      onChange={val => { setField('stage', val); setStageError(null) }}
                      options={STAGE_OPTIONS}
                    />
                    {form.stage === 'facturado' && (
                      <Input
                        id="opp-edit-nrofactura"
                        label="Número de factura *"
                        placeholder="FAC-0001"
                        value={form.nro_factura}
                        onChange={e => setField('nro_factura', e.target.value)}
                      />
                    )}
                    {stageError && (
                      <div style={{ color: '#fca5a5', fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '6px 10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)', borderRadius: '6px' }}>
                        {stageError}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                      <Input
                        id="opp-edit-amount"
                        type="number"
                        placeholder="Monto"
                        value={form.amount}
                        onChange={e => setField('amount', e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <CurrencyToggle />
                    </div>
                    <UserSelect
                      id="opp-edit-assigned_to"
                      value={form.assigned_to}
                      onChange={val => setField('assigned_to', val)}
                    />
                  </div>
                ) : (
                  <>
                    {[
                      { label: 'SERVICIO',    value: SERVICE_OPTIONS.find(s => s.value === opportunity.service)?.label },
                      { label: 'MONTO',       value: opportunity.amount ? `${opportunity.currency} ${Number(opportunity.amount).toLocaleString('es-AR')}` : null },
                      { label: 'RESPONSABLE', value: opportunity.assigned_to, isProfile: true },
                    ].map(row => (
                      <div key={row.label} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: '1rem',
                      }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)', letterSpacing: '0.08em', flexShrink: 0 }}>{row.label}</span>
                        {row.isProfile
                          ? <ProfileAvatar userId={row.value} size="sm" showName />
                          : <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: row.value ? 'var(--off-white)' : 'var(--stone)', textAlign: 'right' }}>{row.value || '—'}</span>
                        }
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Cierre */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <SectionTitle>Fecha de cierre</SectionTitle>
                {editing ? (
                  <Input
                    id="opp-edit-closedate"
                    type="date"
                    value={form.close_date}
                    onChange={e => setField('close_date', e.target.value)}
                  />
                ) : (
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: opportunity.close_date ? 'var(--off-white)' : 'var(--stone)' }}>
                    {opportunity.close_date
                      ? new Date(opportunity.close_date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : '—'}
                  </div>
                )}
              </div>

              {/* Notas / Razón de pérdida */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <SectionTitle>{opportunity.stage === 'perdido' ? 'Razón de pérdida' : 'Notas'}</SectionTitle>
                {editing ? (
                  <Textarea
                    id="opp-edit-notes"
                    placeholder={form.stage === 'perdido' ? 'Razón de pérdida... (requerida)' : 'Notas, observaciones...'}
                    value={form.notes}
                    onChange={e => setField('notes', e.target.value)}
                    resize={false}
                    minHeight="90px"
                  />
                ) : (
                  <div style={{
                    fontFamily: 'var(--font-sans)', fontSize: '13px',
                    color: form.notes ? 'var(--off-white)' : 'var(--stone)',
                    lineHeight: 1.7, whiteSpace: 'pre-wrap',
                  }}>
                    {form.notes || 'Sin notas.'}
                  </div>
                )}
              </div>

              {/* Factura — view mode */}
              {!editing && opportunity.stage === 'facturado' && opportunity.nro_factura && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <SectionTitle>Número de factura</SectionTitle>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--off-white)' }}>
                    {opportunity.nro_factura}
                  </div>
                </div>
              )}

              {/* Estimación técnica — view mode */}
              {!editing && (opportunity.estimacion_tecnica || opportunity.estimacion_horas) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <SectionTitle>Estimación técnica</SectionTitle>
                  {[
                    { label: 'HORAS',           value: opportunity.estimacion_horas ? `${opportunity.estimacion_horas} hs` : null },
                    { label: 'MONTO SUGERIDO',  value: opportunity.estimacion_tecnica ? `${opportunity.currency || 'ARS'} ${Number(opportunity.estimacion_tecnica).toLocaleString('es-AR')}` : null },
                  ].filter(r => r.value).map(row => (
                    <div key={row.label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: '1rem',
                    }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)', letterSpacing: '0.08em' }}>{row.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--off-white)' }}>{row.value}</span>
                    </div>
                  ))}
                  {opportunity.estimacion_notas && (
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--stone)', lineHeight: 1.6 }}>
                      {opportunity.estimacion_notas}
                    </div>
                  )}
                  {opportunity.estimacion_by && (
                    <ProfileAvatar userId={opportunity.estimacion_by} size="xs" showName />
                  )}
                </div>
              )}

              {/* Actividades */}
              {!editing && (
                <ActivitiesSection opportunityId={opportunity.id} />
              )}

              {/* Crear proyecto — view mode, stage ganado */}
              {!editing && opportunity.stage === 'ganado' && (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate(`/proyectos?opp_id=${opportunity.id}&nombre=${encodeURIComponent(opportunity.title)}&empresa=${encodeURIComponent(opportunity.companies?.name || '')}`)}
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
                >
                  CREAR PROYECTO →
                </Button>
              )}

              {/* Edit actions */}
              {editing && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    id="opp-btn-save"
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving}
                    loading={saving}
                    style={{ flex: 1 }}
                  >
                    Guardar cambios
                  </Button>
                  <Button id="opp-btn-cancel" variant="ghost" onClick={cancelEdit}>Cancelar</Button>
                </div>
              )}

              {/* Delete */}
              <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Button
                  id="opp-btn-delete"
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
                >
                  ELIMINAR OPORTUNIDAD
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
