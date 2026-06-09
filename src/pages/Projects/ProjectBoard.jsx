import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext, DragOverlay,
  useSensor, useSensors, PointerSensor,
  useDraggable, useDroppable,
} from '@dnd-kit/core'
import { supabase } from '../../lib/supabase'
import { useProjectTasks } from '../../hooks/useProjectTasks'
import { useCompanies } from '../../hooks/useCompanies'
import { useProjects } from '../../hooks/useProjects'
import { Button, Input, Select, Textarea } from '../../components/ui'
import { TaskDrawer } from './TaskDrawer'
import styles from './ProjectBoard.module.css'
import projectStyles from './Projects.module.css'

/* ── Constants ─────────────────────────────────────────────── */
const COLUMNS = [
  { id: 'backlog',     label: 'Backlog',     color: 'rgba(255,255,255,0.10)' },
  { id: 'en_progreso', label: 'En progreso', color: 'rgba(232,76,30,0.50)'  },
  { id: 'revision',    label: 'Revisión',    color: 'rgba(251,191,36,0.50)' },
  { id: 'hecho',       label: 'Hecho',       color: 'rgba(72,187,100,0.50)' },
]

const COLUMN_OPTIONS = [
  { value: 'backlog',     label: 'Backlog' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'revision',    label: 'Revisión' },
  { value: 'hecho',       label: 'Hecho' },
]

const PRIORITY_OPTIONS = [
  { value: 'alta',  label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja',  label: 'Baja' },
]

const PRIORITY_BORDER = {
  alta:  '#e84c1e',
  media: 'rgba(255,255,255,0.20)',
  baja:  'rgba(255,255,255,0.06)',
}

const PRIORITY_BADGE = {
  alta:  { background: 'rgba(232,76,30,0.22)',   border: '1px solid rgba(232,76,30,0.44)',   color: '#fb7c52' },
  media: { background: 'rgba(251,191,36,0.15)',  border: '1px solid rgba(251,191,36,0.35)',  color: '#fcd34d' },
  baja:  { background: 'rgba(154,148,137,0.10)', border: '1px solid rgba(154,148,137,0.20)', color: 'var(--stone)' },
}

const STATUS_STYLE = {
  activo:    { background: 'rgba(72,187,100,0.18)',  border: '1px solid rgba(72,187,100,0.40)',  color: '#7edda0' },
  pausado:   { background: 'rgba(251,191,36,0.15)',  border: '1px solid rgba(251,191,36,0.35)',  color: '#fcd34d' },
  terminado: { background: 'rgba(154,148,137,0.18)', border: '1px solid rgba(154,148,137,0.35)', color: '#b8b2ab' },
}

const EMPTY_PROJECT_FORM = { name: '', description: '', company_id: null, status: 'activo' }
const STATUS_OPTIONS = [
  { value: 'activo',    label: 'Activo' },
  { value: 'pausado',   label: 'Pausado' },
  { value: 'terminado', label: 'Terminado' },
]

/* ── StatusBadge ───────────────────────────────────────────── */
function StatusBadge({ status }) {
  if (!status) return null
  const s = STATUS_STYLE[status] || STATUS_STYLE.activo
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '100px',
      fontFamily: 'var(--font-mono)', fontSize: '9px',
      letterSpacing: '0.06em', textTransform: 'uppercase',
      flexShrink: 0, ...s,
    }}>
      {status}
    </span>
  )
}

/* ── TaskCardContent — pure display ────────────────────────── */
function TaskCardContent({ task, isOverlay = false, dragRef, dragListeners, dragAttributes, isDragging }) {
  const pb = PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.media
  return (
    <div
      ref={dragRef}
      className={`
        ${styles.taskCard}
        ${isDragging  ? styles.taskCardGhost   : ''}
        ${isOverlay   ? styles.taskCardOverlay : ''}
      `}
      style={{ borderLeftColor: PRIORITY_BORDER[task.priority] || PRIORITY_BORDER.media }}
    >
      <span
        className={styles.dragHandle}
        {...(dragListeners  || {})}
        {...(dragAttributes || {})}
        onClick={e => e.stopPropagation()}
      >⠿</span>
      <div className={styles.taskTitle}>{task.title}</div>
      <div className={styles.taskFooter}>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '1px 7px', borderRadius: '100px',
          fontFamily: 'var(--font-mono)', fontSize: '9px',
          letterSpacing: '0.05em', textTransform: 'uppercase',
          ...pb,
        }}>
          {task.priority}
        </span>
      </div>
    </div>
  )
}

/* ── DraggableTask ─────────────────────────────────────────── */
function DraggableTask({ task, onOpen }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { stage: task.stage },
  })
  return (
    <div onClick={() => !isDragging && onOpen(task)}>
      <TaskCardContent
        task={task}
        dragRef={setNodeRef}
        dragListeners={listeners}
        dragAttributes={attributes}
        isDragging={isDragging}
      />
    </div>
  )
}

/* ── InlineAddForm ─────────────────────────────────────────── */
function InlineAddForm({ columnId, onAdd, onCancel }) {
  const [title, setTitle]       = useState('')
  const [priority, setPriority] = useState('media')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleAdd = async () => {
    if (!title.trim()) return
    await onAdd({ title: title.trim(), priority, stage: columnId })
  }

  return (
    <div id={`inline-form-${columnId}`} className={styles.inlineForm}>
      <input
        ref={inputRef}
        id={`inline-title-${columnId}`}
        className={styles.inlineInput}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleAdd()
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="Título de la tarea..."
      />
      <Select
        id={`inline-priority-${columnId}`}
        value={priority}
        onChange={setPriority}
        options={PRIORITY_OPTIONS}
      />
      <div className={styles.inlineFormActions}>
        <Button variant="primary" size="sm" onClick={handleAdd} style={{ flex: 1 }}>
          Agregar
        </Button>
        <Button
          variant="icon" size="sm" onClick={onCancel}
          style={{ width: '30px', height: '30px', fontSize: '16px' }}
        >×</Button>
      </div>
    </div>
  )
}

/* ── KanbanColumn ──────────────────────────────────────────── */
function KanbanColumn({ col, tasks, addingTo, onSetAdding, onAdd, onCancelAdd, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })
  return (
    <div id={`col-${col.id}`} className={`${styles.column} ${isOver ? styles.columnOver : ''}`}>
      <div className={styles.columnTop} style={{ background: col.color }} />

      <div className={styles.columnHeader}>
        <span className={styles.columnName}>{col.label}</span>
        <div className={styles.columnMeta}>
          <span className={styles.columnCount}>{tasks.length}</span>
          <Button
            id={`col-add-${col.id}`}
            variant="icon" size="sm"
            onClick={() => onSetAdding(col.id)}
            style={{ width: '22px', height: '22px', fontSize: '14px', opacity: 0.6 }}
          >+</Button>
        </div>
      </div>

      <div ref={setNodeRef} className={styles.columnBody}>
        {addingTo === col.id && (
          <InlineAddForm columnId={col.id} onAdd={onAdd} onCancel={onCancelAdd} />
        )}
        {tasks.length === 0 && addingTo !== col.id && (
          <div className={styles.emptyCol}>Sin tareas</div>
        )}
        {tasks.map(task => (
          <DraggableTask key={task.id} task={task} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

/* ── EditProjectDrawer (inline in board topbar) ────────────── */
function EditProjectDrawer({ isOpen, onClose, project, companies, onUpdate, onDelete }) {
  const [form, setForm]   = useState(EMPTY_PROJECT_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen || !project) return
    setForm({
      name:        project.name        || '',
      description: project.description || '',
      company_id:  project.company_id  || null,
      status:      project.status      || 'activo',
    })
    setSaving(false)
  }, [isOpen, project])

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
    setSaving(true)
    await onUpdate({ ...form, company_id: form.company_id || null })
    setSaving(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar "${project?.name}"?\nSe eliminarán todas las tareas del proyecto. Esta acción no se puede deshacer.`)) return
    await onDelete()
  }

  return (
    <>
      <div
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
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : styles.drawerClosed}`}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem',
          flexShrink: 0,
        }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 500, color: 'var(--off-white)' }}>
            Editar proyecto
          </h2>
          <Button variant="icon" size="sm" onClick={onClose} style={{ width: '32px', height: '32px', fontSize: '18px', flexShrink: 0 }}>×</Button>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          <Input
            id="edit-project-name"
            label="Nombre"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
          />
          <Textarea
            id="edit-project-description"
            label="Descripción"
            value={form.description}
            onChange={e => setField('description', e.target.value)}
            resize={false}
            minHeight="80px"
          />
          <Select
            id="edit-project-company"
            label="Cliente"
            value={form.company_id}
            onChange={val => setField('company_id', val)}
            options={companyOptions}
          />
          <Select
            id="edit-project-status"
            label="Estado"
            value={form.status}
            onChange={val => setField('status', val)}
            options={STATUS_OPTIONS}
          />
          <Button
            id="edit-project-save"
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            loading={saving}
            fullWidth
          >
            Guardar cambios
          </Button>
          <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Button
              id="edit-project-delete"
              variant="danger" size="sm" onClick={handleDelete}
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
            >
              ELIMINAR PROYECTO
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── ProjectBoard ──────────────────────────────────────────── */
export default function ProjectBoard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask } = useProjectTasks(id)
  const { companies } = useCompanies()

  const [project, setProject]           = useState(null)
  const [localTasks, setLocalTasks]     = useState([])
  const [activeId, setActiveId]         = useState(null)
  const [addingToCol, setAddingToCol]   = useState(null)
  const [taskDrawerOpen, setTaskDrawerOpen]   = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [editDrawerOpen, setEditDrawerOpen]   = useState(false)

  // Fetch single project
  const fetchProject = useCallback(async () => {
    const { data } = await supabase
      .from('projects')
      .select('*, companies(id, name)')
      .eq('id', id)
      .single()
    setProject(data)
  }, [id])

  useEffect(() => { fetchProject() }, [fetchProject])

  // Sync local tasks from server
  useEffect(() => { setLocalTasks(tasks) }, [tasks])

  const activeTask = useMemo(
    () => activeId ? localTasks.find(t => t.id === activeId) : null,
    [activeId, localTasks]
  )

  // Derive fresh selected task from localTasks
  const selectedTaskFresh = useMemo(
    () => selectedTask ? (localTasks.find(t => t.id === selectedTask.id) ?? selectedTask) : null,
    [selectedTask, localTasks]
  )

  // DnD sensors — 8px prevents accidental drag on click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = useCallback(({ active }) => {
    setActiveId(active.id)
  }, [])

  const handleDragEnd = useCallback(async ({ active, over }) => {
    setActiveId(null)
    if (!over) return
    const task = localTasks.find(t => t.id === active.id)
    if (!task || task.stage === over.id) return
    // Optimistic update
    setLocalTasks(prev => prev.map(t => t.id === active.id ? { ...t, stage: over.id } : t))
    await updateTask(active.id, { stage: over.id })
  }, [localTasks, updateTask])

  const handleAddTask = useCallback(async (payload) => {
    const { error } = await createTask(payload)
    if (!error) setAddingToCol(null)
  }, [createTask])

  const openTask = useCallback((task) => {
    setSelectedTask(task)
    setTaskDrawerOpen(true)
  }, [])

  const closeTaskDrawer = useCallback(() => {
    setTaskDrawerOpen(false)
    setSelectedTask(null)
  }, [])

  const handleUpdateProject = async (payload) => {
    await supabase.from('projects').update(payload).eq('id', id)
    fetchProject()
  }

  const handleDeleteProject = async () => {
    await supabase.from('projects').delete().eq('id', id)
    navigate('/proyectos')
  }

  const totalTasks = localTasks.length
  const doneTasks  = localTasks.filter(t => t.stage === 'hecho').length

  return (
    <div id="project-board-page" className={styles.page}>

      {/* Topbar */}
      <div
        id="board-topbar"
        style={{
          background: 'rgba(22,20,18,0.62)',
          backdropFilter: 'blur(28px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
          border: '1px solid rgba(255,255,255,0.22)',
          borderRadius: '18px',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: '10px',
          flexShrink: 0, flexWrap: 'wrap',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        <Button
          id="board-btn-back"
          variant="ghost" size="sm"
          onClick={() => navigate('/proyectos')}
          style={{ flexShrink: 0 }}
        >
          ← Proyectos
        </Button>

        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

        <span
          id="board-project-name"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: 'var(--off-white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}
        >
          {project?.name || '—'}
        </span>

        {project?.status && <StatusBadge status={project.status} />}

        {project?.companies?.name && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)', flexShrink: 0 }}>
            {project.companies.name}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
          <Button
            id="board-btn-edit"
            variant="ghost" size="sm"
            onClick={() => setEditDrawerOpen(true)}
          >
            Editar proyecto
          </Button>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '100px', padding: '2px 8px',
          }}>
            {doneTasks}/{totalTasks}
          </span>
        </div>
      </div>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div id="project-board" className={styles.board}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              col={col}
              tasks={localTasks.filter(t => t.stage === col.id)}
              addingTo={addingToCol}
              onSetAdding={setAddingToCol}
              onAdd={handleAddTask}
              onCancelAdd={() => setAddingToCol(null)}
              onOpen={openTask}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask && <TaskCardContent task={activeTask} isOverlay />}
        </DragOverlay>
      </DndContext>

      {/* Task drawer */}
      <TaskDrawer
        isOpen={taskDrawerOpen}
        onClose={closeTaskDrawer}
        task={selectedTaskFresh}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />

      {/* Edit project drawer */}
      <EditProjectDrawer
        isOpen={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        project={project}
        companies={companies}
        onUpdate={handleUpdateProject}
        onDelete={handleDeleteProject}
      />
    </div>
  )
}
