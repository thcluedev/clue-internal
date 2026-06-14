import { useState, useEffect } from 'react'
import { Button, Input, Badge, Select, Textarea } from '../../components/ui'
import { useCompanies } from '../../hooks/useCompanies'
import styles from './CRM.module.css'

const STAGE_OPTIONS = [
  { value: 'prospecto',  label: 'Prospecto' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'cotizado',   label: 'Cotizado' },
  { value: 'cerrado',    label: 'Cerrado' },
  { value: 'perdido',    label: 'Perdido' },
]

const SERVICE_OPTIONS = [
  { value: 'odoo',      label: 'Odoo' },
  { value: 'sistemas',  label: 'Sistemas' },
  { value: 'web',       label: 'Web' },
  { value: 'ecommerce', label: 'E-commerce' },
]

const STAGE_STYLE = {
  prospecto:  { background: 'rgba(154,148,137,0.20)', border: '1px solid rgba(154,148,137,0.40)', color: '#b8b2ab' },
  contactado: { background: 'rgba(79,142,255,0.18)',  border: '1px solid rgba(79,142,255,0.38)',  color: '#82b4ff' },
  cotizado:   { background: 'rgba(251,191,36,0.18)',  border: '1px solid rgba(251,191,36,0.38)',  color: '#fcd34d' },
  cerrado:    { background: 'rgba(72,187,100,0.22)',  border: '1px solid rgba(72,187,100,0.45)',  color: '#7edda0' },
  perdido:    { background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.38)', color: '#fca5a5' },
}

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

const EMPTY_FORM = {
  title: '',
  company_id: null,
  stage: 'prospecto',
  service: 'odoo',
  amount: '',
  currency: 'ARS',
  assigned_to: '',
  close_date: '',
  notes: '',
}

export function OpportunityDrawer({ isOpen, onClose, opportunity, onCreate, onUpdate, onDelete }) {
  const isCreate = isOpen && opportunity === null
  const { companies } = useCompanies()

  const companyOptions = companies.map(c => ({ value: c.id, label: c.name }))

  const [editing, setEditing]               = useState(false)
  const [form, setForm]                     = useState(EMPTY_FORM)
  const [titleError, setTitleError]         = useState(false)
  const [saving, setSaving]                 = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm(opportunity ? {
        title:       opportunity.title || '',
        company_id:  opportunity.company_id || null,
        stage:       opportunity.stage || 'prospecto',
        service:     opportunity.service || 'odoo',
        amount:      opportunity.amount ?? '',
        currency:    opportunity.currency || 'ARS',
        assigned_to: opportunity.assigned_to || '',
        close_date:  opportunity.close_date || '',
        notes:       opportunity.notes || '',
      } : EMPTY_FORM)
    }
    setEditing(false)
    setTitleError(false)
  }, [opportunity, isOpen])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.title.trim()) { setTitleError(true); return }
    setTitleError(false)
    setSaving(true)
    const payload = {
      ...form,
      amount:      form.amount === '' ? null : Number(form.amount),
      company_id:  form.company_id  || null,
      close_date:  form.close_date  || null,
      assigned_to: form.assigned_to || null,
      notes:       form.notes       || null,
    }
    if (isCreate) {
      console.log('payload:', JSON.stringify(payload, null, 2))
      const { error } = await onCreate(payload)
      if (error) console.log('supabase error:', JSON.stringify(error, null, 2))
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
    if (opportunity) {
      setForm({
        title:       opportunity.title || '',
        company_id:  opportunity.company_id || null,
        stage:       opportunity.stage || 'prospecto',
        service:     opportunity.service || 'odoo',
        amount:      opportunity.amount ?? '',
        currency:    opportunity.currency || 'ARS',
        assigned_to: opportunity.assigned_to || '',
        close_date:  opportunity.close_date || '',
        notes:       opportunity.notes || '',
      })
    }
  }

  const stageStyle = STAGE_STYLE[opportunity?.stage] || STAGE_STYLE.prospecto
  const stageLabel = STAGE_OPTIONS.find(s => s.value === opportunity?.stage)?.label || ''

  const CurrencyToggle = () => (
    <div style={{ display: 'flex', gap: '6px' }}>
      <Button
        variant={form.currency === 'ARS' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setField('currency', 'ARS')}
      >
        ARS
      </Button>
      <Button
        variant={form.currency === 'USD' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setField('currency', 'USD')}
      >
        USD
      </Button>
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
                <Input
                  id="opp-create-assigned_to"
                  placeholder="Responsable"
                  value={form.assigned_to}
                  onChange={e => setField('assigned_to', e.target.value)}
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
                      onChange={val => setField('stage', val)}
                      options={STAGE_OPTIONS}
                    />
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
                    <Input
                      id="opp-edit-assigned_to"
                      placeholder="Responsable"
                      value={form.assigned_to}
                      onChange={e => setField('assigned_to', e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    {[
                      { label: 'SERVICIO',    value: SERVICE_OPTIONS.find(s => s.value === opportunity.service)?.label },
                      { label: 'MONTO',       value: opportunity.amount ? `${opportunity.currency} ${Number(opportunity.amount).toLocaleString('es-AR')}` : null },
                      { label: 'RESPONSABLE', value: opportunity.assigned_to },
                    ].map(row => (
                      <div key={row.label} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: '1rem',
                      }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)', letterSpacing: '0.08em', flexShrink: 0 }}>{row.label}</span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: row.value ? 'var(--off-white)' : 'var(--stone)', textAlign: 'right' }}>{row.value || '—'}</span>
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

              {/* Notas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <SectionTitle>Notas</SectionTitle>
                {editing ? (
                  <Textarea
                    id="opp-edit-notes"
                    placeholder="Notas, observaciones..."
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
