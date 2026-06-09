import { useState, useEffect } from 'react'
import { Button, Select, Textarea } from '../../components/ui'
import styles from './ProjectBoard.module.css'

/* ── Constants ─────────────────────────────────────────────── */
const COLUMN_OPTIONS = [
  { value: 'backlog',     label: 'Backlog' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'revision',    label: 'Revisión' },
  { value: 'hecho',       label: 'Hecho' },
]

const PRIORITY_BADGE = {
  alta:  { background: 'rgba(232,76,30,0.22)',   border: '1px solid rgba(232,76,30,0.44)',   color: '#fb7c52' },
  media: { background: 'rgba(251,191,36,0.18)',  border: '1px solid rgba(251,191,36,0.36)',  color: '#fcd34d' },
  baja:  { background: 'rgba(154,148,137,0.15)', border: '1px solid rgba(154,148,137,0.32)', color: '#b8b2ab' },
}

const PRIORITY_ACTIVE = {
  alta:  { background: 'rgba(232,76,30,0.22)', borderColor: 'rgba(232,76,30,0.50)', color: '#fb7c52' },
  media: { background: 'rgba(251,191,36,0.18)', borderColor: 'rgba(251,191,36,0.45)', color: '#fcd34d' },
  baja:  { background: 'rgba(154,148,137,0.15)', borderColor: 'rgba(154,148,137,0.38)', color: '#b8b2ab' },
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)',
      textTransform: 'uppercase', letterSpacing: '0.15em',
      paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {children}
    </div>
  )
}

/* ── TaskDrawer ────────────────────────────────────────────── */
export function TaskDrawer({ isOpen, onClose, task, onUpdate, onDelete }) {
  const [form, setForm]             = useState({ title: '', column: 'backlog', priority: 'media', description: '' })
  const [editingTitle, setEditingTitle] = useState(false)
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    if (!isOpen || !task) return
    setForm({
      title:       task.title       || '',
      column:      task.column      || 'backlog',
      priority:    task.priority    || 'media',
      description: task.description || '',
    })
    setEditingTitle(false)
    setSaving(false)
  }, [isOpen, task])

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!task) return
    setSaving(true)
    await onUpdate(task.id, form)
    setSaving(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!task) return
    if (!window.confirm(`¿Eliminar "${task.title}"?\nEsta acción no se puede deshacer.`)) return
    await onDelete(task.id)
    onClose()
  }

  const pb = PRIORITY_BADGE[form.priority] || PRIORITY_BADGE.media

  return (
    <>
      {/* Overlay */}
      <div
        id="task-drawer-overlay"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s',
        }}
      />

      {/* Drawer */}
      <div
        id="task-drawer"
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : styles.drawerClosed}`}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Inline title edit */}
            {editingTitle ? (
              <input
                id="task-title-input"
                autoFocus
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false) }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '18px',
                  color: 'var(--off-white)',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <h2
                id="task-title-display"
                onClick={() => setEditingTitle(true)}
                title="Click para editar"
                style={{
                  fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 400,
                  color: 'var(--off-white)', cursor: 'text', lineHeight: 1.4,
                  wordBreak: 'break-word',
                  padding: '2px 6px', margin: '0 -6px',
                  borderRadius: '6px',
                  border: '1px solid transparent',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'transparent'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {form.title || 'Sin título'}
              </h2>
            )}
            {/* Priority badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '2px 8px', borderRadius: '100px', marginTop: '8px',
              fontFamily: 'var(--font-mono)', fontSize: '9px',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              ...pb,
            }}>
              {form.priority}
            </span>
          </div>

          <Button
            id="task-drawer-close"
            variant="icon" size="sm" onClick={onClose}
            style={{ width: '32px', height: '32px', fontSize: '18px', flexShrink: 0 }}
          >×</Button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>

          {/* Columna */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <SectionTitle>Columna</SectionTitle>
            <Select
              id="task-column"
              value={form.column}
              onChange={val => setField('column', val)}
              options={COLUMN_OPTIONS}
            />
          </div>

          {/* Prioridad */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <SectionTitle>Prioridad</SectionTitle>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['alta', 'media', 'baja'].map(p => {
                const isActive = form.priority === p
                return (
                  <Button
                    key={p}
                    id={`task-priority-${p}`}
                    variant={isActive && p === 'alta' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setField('priority', p)}
                    style={isActive && p !== 'alta' ? PRIORITY_ACTIVE[p] : {}}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Descripción */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <SectionTitle>Descripción</SectionTitle>
            <Textarea
              id="task-description"
              placeholder="Agregar descripción..."
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              resize={false}
              minHeight="120px"
            />
          </div>

          {/* Save */}
          <Button
            id="task-btn-save"
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            loading={saving}
            fullWidth
          >
            Guardar cambios
          </Button>

          {/* Delete */}
          <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Button
              id="task-btn-delete"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
            >
              ELIMINAR TAREA
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
