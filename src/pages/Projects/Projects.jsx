import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useProjects } from '../../hooks/useProjects'
import { useCompanies } from '../../hooks/useCompanies'
import { Button, Input, Select, Textarea } from '../../components/ui'
import styles from './Projects.module.css'

/* ── Constants ─────────────────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: 'activo',    label: 'Activo' },
  { value: 'pausado',   label: 'Pausado' },
  { value: 'terminado', label: 'Terminado' },
]

const STATUS_STYLE = {
  activo:    { background: 'rgba(72,187,100,0.18)',   border: '1px solid rgba(72,187,100,0.40)',   color: '#7edda0' },
  pausado:   { background: 'rgba(251,191,36,0.15)',   border: '1px solid rgba(251,191,36,0.35)',   color: '#fcd34d' },
  terminado: { background: 'rgba(154,148,137,0.18)', border: '1px solid rgba(154,148,137,0.35)', color: '#b8b2ab' },
}

const FILTER_LABELS = { todos: 'Todos', activo: 'Activo', pausado: 'Pausado', terminado: 'Terminado' }

const EMPTY_FORM = { name: '', description: '', company_id: null, status: 'activo' }

/* ── StatusBadge ───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.activo
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '100px',
      fontFamily: 'var(--font-mono)', fontSize: '9px',
      letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500,
      flexShrink: 0, ...s,
    }}>
      {status}
    </span>
  )
}

/* ── ProjectDrawer ─────────────────────────────────────────── */
function ProjectDrawer({ isOpen, onClose, project, companies, onCreate, onUpdate, onDelete, initialValues }) {
  const isCreate = !project
  const [form, setForm]           = useState(EMPTY_FORM)
  const [nameError, setNameError] = useState(false)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setForm(project ? {
      name:        project.name        || '',
      description: project.description || '',
      company_id:  project.company_id  || null,
      status:      project.status      || 'activo',
    } : (initialValues || EMPTY_FORM))
    setNameError(false)
    setSaving(false)
  }, [isOpen, project, initialValues])

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const companyOptions = [
    { value: null, label: 'Proyecto interno' },
    ...companies.map(c => ({ value: c.id, label: c.name })),
  ]

  const handleSave = async () => {
    if (!form.name.trim()) { setNameError(true); return }
    setSaving(true)
    const payload = { ...form, company_id: form.company_id || null }
    if (isCreate) {
      const { error } = await onCreate(payload)
      if (!error) onClose()
    } else {
      await onUpdate(project.id, payload)
      onClose()
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar "${project.name}"?\nSe eliminarán todas las tareas del proyecto. Esta acción no se puede deshacer.`)) return
    await onDelete(project.id)
    onClose()
  }

  return (
    <>
      <div
        id="project-drawer-overlay"
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
      <div
        id="project-drawer"
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : styles.drawerClosed}`}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem',
          flexShrink: 0,
        }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 500, color: 'var(--off-white)' }}>
            {isCreate ? 'Nuevo proyecto' : project?.name}
          </h2>
          <Button
            id="project-drawer-close"
            variant="icon" size="sm" onClick={onClose}
            style={{ width: '32px', height: '32px', fontSize: '18px', flexShrink: 0 }}
          >×</Button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          <Input
            id="project-name"
            label="Nombre *"
            placeholder="Nombre del proyecto"
            value={form.name}
            onChange={e => { setField('name', e.target.value); setNameError(false) }}
            error={nameError ? 'El nombre es requerido' : undefined}
          />
          <Textarea
            id="project-description"
            label="Descripción"
            placeholder="Descripción del proyecto..."
            value={form.description}
            onChange={e => setField('description', e.target.value)}
            resize={false}
            minHeight="90px"
          />
          <Select
            id="project-company"
            label="Cliente"
            value={form.company_id}
            onChange={val => setField('company_id', val)}
            options={companyOptions}
          />
          <Select
            id="project-status"
            label="Estado"
            value={form.status}
            onChange={val => setField('status', val)}
            options={STATUS_OPTIONS}
          />

          <Button
            id="project-btn-save"
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            loading={saving}
            fullWidth
          >
            {isCreate ? 'Crear proyecto' : 'Guardar cambios'}
          </Button>

          {!isCreate && (
            <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Button
                id="project-btn-delete"
                variant="danger"
                size="sm"
                onClick={handleDelete}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
              >
                ELIMINAR PROYECTO
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ── Projects page ─────────────────────────────────────────── */
export default function Projects() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects()
  const { companies } = useCompanies()
  const [filter, setFilter]                   = useState('todos')
  const [drawerOpen, setDrawerOpen]           = useState(false)
  const [editingProject, setEditingProject]   = useState(null)
  const [initialProjectValues, setInitialProjectValues] = useState(null)

  useEffect(() => {
    const nombre  = searchParams.get('nombre')
    if (!nombre || !companies.length) return
    const empresa = searchParams.get('empresa')
    const company = companies.find(c => c.name === empresa)
    setInitialProjectValues({ name: nombre, description: '', company_id: company?.id || null, status: 'activo' })
    setEditingProject(null)
    setDrawerOpen(true)
  }, [searchParams, companies])

  const filtered = useMemo(() =>
    filter === 'todos' ? projects : projects.filter(p => p.status === filter),
    [projects, filter]
  )

  const openCreate = () => { setEditingProject(null); setDrawerOpen(true) }
  const closeDrawer = () => setDrawerOpen(false)

  return (
    <div id="projects-page" className={styles.page}>

      {/* Topbar */}
      <div
        id="projects-topbar"
        style={{
          background: 'rgba(22,20,18,0.62)',
          backdropFilter: 'blur(28px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
          border: '1px solid rgba(255,255,255,0.22)',
          borderRadius: '18px',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          flexShrink: 0, flexWrap: 'wrap',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)',
          textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap',
        }}>
          04 — PROYECTOS
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div id="projects-status-filters" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {Object.entries(FILTER_LABELS).map(([f, label]) => (
              <Button
                key={f}
                id={`projects-filter-${f}`}
                variant="ghost"
                size="sm"
                onClick={() => setFilter(f)}
                style={filter === f
                  ? { borderColor: 'var(--ember-border)', color: 'var(--ember)', background: 'var(--ember-dim)' }
                  : {}}
              >
                {label}
              </Button>
            ))}
          </div>
          <Button id="projects-btn-new" variant="primary" size="sm" onClick={openCreate}>
            + Nuevo proyecto
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone)', letterSpacing: '0.08em' }}>
          CARGANDO...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--stone)', padding: '3rem', textAlign: 'center' }}>
          {filter !== 'todos' ? 'Sin proyectos con ese estado.' : 'Todavía no hay proyectos.'}
        </div>
      ) : (
        <div id="projects-grid" className={styles.grid}>
          {filtered.map(project => {
            const total   = project.tasks?.length || 0
            const done    = project.tasks?.filter(t => t.stage === 'hecho').length || 0
            const pct     = total > 0 ? (done / total) * 100 : 0
            const dateStr = new Date(project.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })

            return (
              <div
                key={project.id}
                id={`project-card-${project.id}`}
                className={styles.projectCard}
                onClick={() => navigate(`/proyectos/${project.id}`)}
              >
                {/* Name + badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <span className={styles.projectName}>{project.name}</span>
                  <StatusBadge status={project.status} />
                </div>

                {/* Company */}
                <div className={styles.projectCompany}>
                  {project.companies?.name || 'Proyecto interno'}
                </div>

                {/* Description */}
                {project.description && (
                  <div className={styles.projectDesc}>{project.description}</div>
                )}

                {/* Progress */}
                <div className={styles.progressWrap}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={styles.progressLabel}>{done}/{total} tareas completadas</span>
                </div>

                {/* Footer */}
                <div className={styles.cardFooter}>
                  <span className={styles.cardDate}>{dateStr}</span>
                  <Button
                    id={`project-board-btn-${project.id}`}
                    variant="ghost"
                    size="sm"
                    onClick={e => { e.stopPropagation(); navigate(`/proyectos/${project.id}`) }}
                  >
                    Ver tablero →
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ProjectDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        project={editingProject}
        companies={companies}
        onCreate={createProject}
        onUpdate={updateProject}
        onDelete={deleteProject}
        initialValues={initialProjectValues}
      />
    </div>
  )
}
