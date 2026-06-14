import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  DndContext, DragOverlay,
  useSensor, useSensors, PointerSensor,
  useDraggable, useDroppable,
} from '@dnd-kit/core'
import { useAllActivities } from '../../hooks/useAllActivities'
import { useOpportunities } from '../../hooks/useOpportunities'
import { supabase } from '../../lib/supabase'
import { Button, Card, Modal, Select, Input, Textarea, UserSelect, ProfileAvatar } from '../../components/ui'
import { OpportunityDrawer } from './OpportunityDrawer'
import styles from './ActivitiesView.module.css'

/* ── Constants ─────────────────────────────────────────────── */
const TYPE_ICONS = {
  llamada: '📞', reunion: '👥', mail: '✉️', tarea: '✓',
  seguimiento_normal: '🔄', seguimiento_interesado: '🟢',
  seguimiento_no_interesado: '🔴', otro: '·',
}

const TYPE_COLORS = {
  llamada:                   '#3b82f6',
  reunion:                   '#8b5cf6',
  mail:                      '#4a9a5a',
  tarea:                     '#e84c1e',
  seguimiento_normal:        '#9a9489',
  seguimiento_interesado:    '#4a9a5a',
  seguimiento_no_interesado: '#9a4a4a',
  otro:                      'rgba(255,255,255,0.18)',
}

const TYPE_OPTIONS = [
  { value: 'llamada',                   label: 'Llamada' },
  { value: 'reunion',                   label: 'Reunión' },
  { value: 'mail',                      label: 'Mail' },
  { value: 'tarea',                     label: 'Tarea' },
  { value: 'seguimiento_normal',        label: '🔄 Seguimiento normal' },
  { value: 'seguimiento_interesado',    label: '🟢 Seguimiento interesado' },
  { value: 'seguimiento_no_interesado', label: '🔴 Seguimiento no interesado' },
  { value: 'otro',                      label: 'Otro' },
]

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const DAYS_ES   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

/* ── Helpers ───────────────────────────────────────────────── */
function getWeekDates(weekOffset = 0) {
  const today = new Date()
  const dow   = today.getDay()
  const diff  = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function currentISO() {
  return toISO(new Date())
}

function formatWeekTitle(dates) {
  const s = dates[0], e = dates[6]
  if (s.getMonth() === e.getMonth())
    return `${s.getDate()} – ${e.getDate()} de ${MONTHS_ES[s.getMonth()]} ${s.getFullYear()}`
  if (s.getFullYear() === e.getFullYear())
    return `${s.getDate()} de ${MONTHS_ES[s.getMonth()]} – ${e.getDate()} de ${MONTHS_ES[e.getMonth()]} ${s.getFullYear()}`
  return `${s.getDate()}/${s.getMonth()+1}/${s.getFullYear()} – ${e.getDate()}/${e.getMonth()+1}/${e.getFullYear()}`
}

function formatDateHeader(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${DAYS_ES[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`
}

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`
}

/* ── ActivityRow ────────────────────────────────────────────── */
function ActivityRow({ act, today, fading, onToggleDone, onOpenOpp }) {
  const isOverdue = act.due_date && act.due_date < today
  const isToday   = act.due_date === today
  const dateClass = isOverdue ? styles.dateOverdue : isToday ? styles.dateToday : styles.dateFuture
  const oppMeta   = [
    act.opportunities?.companies?.name,
    act.opportunities?.title,
  ].filter(Boolean).join(' · ')

  return (
    <div className={`${styles.activityRow} ${fading ? styles.activityRowFading : ''}`}>
      <button
        className={styles.checkbox}
        onClick={() => onToggleDone(act.id)}
        title="Marcar como completada"
      />
      <span className={styles.typeIcon}>{TYPE_ICONS[act.type] || '·'}</span>
      <span className={styles.activityTitle}>{act.title}</span>
      <span className={styles.activityMeta}>{oppMeta}</span>
      <ProfileAvatar userId={act.assigned_to} size="xs" />
      <span className={`${styles.dateText} ${dateClass}`}>
        {formatShortDate(act.due_date)}
      </span>
      <button
        className={styles.openOppBtn}
        onClick={() => onOpenOpp(act.opportunities?.id)}
        title="Ver oportunidad"
      >→</button>
    </div>
  )
}

/* ── CalCard (draggable) ─────────────────────────────────────── */
function CalCard({ act, isOverlay = false }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: act.id })
  const color = TYPE_COLORS[act.type] || 'rgba(255,255,255,0.18)'

  const content = (
    <div
      className={`${styles.calCard} ${isDragging && !isOverlay ? styles.calCardDragging : ''}`}
      style={{ borderLeftColor: color }}
    >
      <div className={styles.calCardTitle}>
        <span style={{ marginRight: 4 }}>{TYPE_ICONS[act.type] || '·'}</span>
        {act.title}
      </div>
      <ProfileAvatar userId={act.assigned_to} size="xs" />
    </div>
  )

  if (isOverlay) return content

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0.3 : 1 }}
    >
      {content}
    </div>
  )
}

/* ── CalColumn (droppable) ───────────────────────────────────── */
function CalColumn({ colId, dayName, dayNum, isToday, isNoDate, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: colId })

  return (
    <div className={`
      ${styles.calCol}
      ${isToday   ? styles.calColToday  : ''}
      ${isNoDate  ? styles.calColNoDate : ''}
      ${isOver    ? styles.calColOver   : ''}
    `}>
      <div className={styles.calColHeader}>
        <div className={styles.calDayName}>{dayName}</div>
        <div className={`${styles.calDayNum} ${isToday ? styles.calDayNumToday : ''}`}>{dayNum}</div>
      </div>
      <div ref={setNodeRef} className={styles.calColBody}>
        {children}
      </div>
    </div>
  )
}

/* ── NewActivityModal ─────────────────────────────────────────── */
const EMPTY_MODAL_FORM = {
  opportunity_id: null,
  type: 'llamada',
  title: '',
  assigned_to: '',
  due_date: '',
  notes: '',
}

function NewActivityModal({ isOpen, onClose, refetch }) {
  const { opportunities } = useOpportunities()
  const [form,   setFormState] = useState({ ...EMPTY_MODAL_FORM })
  const [errors, setErrors]    = useState({})
  const [saving, setSaving]    = useState(false)

  useEffect(() => {
    if (!isOpen) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setFormState(f => ({ ...f, assigned_to: user.id }))
    })
  }, [isOpen])

  const setField = (key, val) => setFormState(f => ({ ...f, [key]: val }))
  const clearErr = (key) => setErrors(e => { const n = { ...e }; delete n[key]; return n })

  const oppOptions = [
    { value: null, label: 'Seleccionar oportunidad...' },
    ...opportunities.map(o => ({
      value: o.id,
      label: o.companies?.name ? `${o.companies.name} · ${o.title}` : o.title,
    })),
  ]

  const handleCreate = async () => {
    const errs = {}
    if (!form.opportunity_id) errs.opportunity_id = 'Requerido'
    if (!form.title.trim())   errs.title = 'Requerido'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('activities').insert({
      opportunity_id: form.opportunity_id,
      type:           form.type,
      title:          form.title.trim(),
      assigned_to:    form.assigned_to  || null,
      due_date:       form.due_date     || null,
      notes:          form.notes        || null,
      created_by:     user.id,
    }).select().single()

    if (!error) {
      if (data && form.assigned_to && form.assigned_to !== user.id) {
        await supabase.functions.invoke('notify-activity', { body: { activityId: data.id } })
      }
      setFormState({ ...EMPTY_MODAL_FORM, assigned_to: user.id })
      setErrors({})
      refetch()
      onClose()
    }
    setSaving(false)
  }

  return (
    <Modal
      id="new-activity-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva actividad"
      size="sm"
      footer={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleCreate} disabled={saving} loading={saving}>
            Crear actividad
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Select
          label="Oportunidad *"
          value={form.opportunity_id}
          onChange={val => { setField('opportunity_id', val); clearErr('opportunity_id') }}
          options={oppOptions}
          error={errors.opportunity_id}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: '0 0 148px' }}>
            <Select
              label="Tipo"
              value={form.type}
              onChange={val => setField('type', val)}
              options={TYPE_OPTIONS}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input
              label="Título *"
              placeholder="Título de la actividad"
              value={form.title}
              onChange={e => { setField('title', e.target.value); clearErr('title') }}
              error={errors.title}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <UserSelect
              label="Responsable"
              value={form.assigned_to}
              onChange={val => setField('assigned_to', val)}
            />
          </div>
          <div style={{ flex: '0 0 148px' }}>
            <Input
              label="Fecha"
              type="date"
              value={form.due_date}
              onChange={e => setField('due_date', e.target.value)}
            />
          </div>
        </div>
        <Textarea
          label="Notas"
          placeholder="Notas opcionales..."
          value={form.notes}
          onChange={e => setField('notes', e.target.value)}
          resize={false}
          minHeight="70px"
        />
      </div>
    </Modal>
  )
}

/* ── ActivitiesView ───────────────────────────────────────────── */
export function ActivitiesView({ newActivityOpen, onNewActivityClose }) {
  const [onlyMine,    setOnlyMine]    = useState(true)
  const [viewMode,    setViewMode]    = useState('list')
  const [weekOffset,  setWeekOffset]  = useState(0)
  const [collapsed,   setCollapsed]   = useState({ overdue: false, upcoming: false, noDate: true })
  const [fadingIds,   setFadingIds]   = useState(new Set())
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUser(user)
    })
  }, [])

  const { activities, loading, overdue, dueToday, upcoming, noDate, reschedule, toggleDone, refetch } =
    useAllActivities({ onlyMine, userId: currentUser?.id ?? null })

  // Optimistic state for calendar DnD
  const [localActs, setLocalActs] = useState([])
  const [activeId,  setActiveId]  = useState(null)

  useEffect(() => { setLocalActs(activities) }, [activities])

  // Opportunity drawer
  const { opportunities, updateOpportunity, deleteOpportunity } = useOpportunities()
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [selectedOppId,  setSelectedOppId]  = useState(null)

  const selectedOpp = useMemo(
    () => selectedOppId ? (opportunities.find(o => o.id === selectedOppId) ?? null) : null,
    [selectedOppId, opportunities]
  )

  const openOpp = (oppId) => {
    if (!oppId) return
    setSelectedOppId(oppId)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedOppId(null)
  }

  // Toggle done with fade-out animation
  const handleToggleDone = useCallback((id) => {
    setFadingIds(prev => new Set([...prev, id]))
    setTimeout(async () => {
      await toggleDone(id)
      setFadingIds(prev => { const s = new Set(prev); s.delete(id); return s })
    }, 340)
  }, [toggleDone])

  const today = currentISO()

  // Group upcoming by date
  const upcomingByDate = useMemo(() => {
    const groups = []
    const seen   = {}
    for (const a of upcoming) {
      if (!seen[a.due_date]) {
        seen[a.due_date] = []
        groups.push({ date: a.due_date, acts: seen[a.due_date] })
      }
      seen[a.due_date].push(a)
    }
    return groups
  }, [upcoming])

  const toggleCollapse = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))

  // ── Calendar ─────────────────────────────────────────────────
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const weekISOs  = useMemo(() => weekDates.map(toISO), [weekDates])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragStart = useCallback(({ active }) => setActiveId(active.id), [])

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveId(null)
    if (!over) return
    const newDate = over.id === 'cal-no-date' ? null : String(over.id)
    const act = localActs.find(a => a.id === active.id)
    if (!act || act.due_date === newDate) return
    setLocalActs(prev => prev.map(a => a.id === active.id ? { ...a, due_date: newDate } : a))
    reschedule(active.id, newDate)
  }, [localActs, reschedule])

  const activeAct = useMemo(() => localActs.find(a => a.id === activeId), [activeId, localActs])

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className={styles.view}>

      {/* Sub-topbar */}
      <Card style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
        <div className={styles.toggleGroup}>
          <Button
            variant={onlyMine ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setOnlyMine(true)}
          >Mis actividades</Button>
          <Button
            variant={!onlyMine ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setOnlyMine(false)}
          >Todo el equipo</Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className={styles.summary}>
            {overdue.length > 0 && (
              <span className={styles.summaryOverdue}>{overdue.length} vencida{overdue.length !== 1 ? 's' : ''} · </span>
            )}
            <span>{dueToday.length} hoy</span>
            {upcoming.length > 0 && ` · ${upcoming.length} próxima${upcoming.length !== 1 ? 's' : ''}`}
          </span>
          <div className={styles.toggleGroup}>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              title="Vista lista"
            >☰</Button>
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              title="Vista calendario"
            >▦</Button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone)', letterSpacing: '0.08em' }}>
          CARGANDO...
        </div>

      ) : viewMode === 'list' ? (

        /* ── LIST ──────────────────────────────────────────────── */
        <div className={styles.listWrap}>

          {/* Vencidas */}
          {overdue.length > 0 && (
            <div
              className={styles.section}
              style={{ borderLeft: '2px solid rgba(232,76,30,0.42)', background: 'rgba(232,76,30,0.035)' }}
            >
              <div className={styles.sectionHeader} onClick={() => toggleCollapse('overdue')}>
                <span className={styles.sectionLabel}>Vencidas</span>
                <span
                  className={styles.sectionBadge}
                  style={{ background: 'rgba(232,76,30,0.16)', border: '1px solid rgba(232,76,30,0.34)', color: 'var(--ember)' }}
                >
                  {overdue.length}
                </span>
                <span className={styles.collapseIcon}>{collapsed.overdue ? '▶' : '▼'}</span>
              </div>
              {!collapsed.overdue && overdue.map(act => (
                <ActivityRow
                  key={act.id}
                  act={act}
                  today={today}
                  fading={fadingIds.has(act.id)}
                  onToggleDone={handleToggleDone}
                  onOpenOpp={openOpp}
                />
              ))}
            </div>
          )}

          {/* Hoy */}
          <div className={styles.section}>
            <div className={styles.sectionHeaderStatic}>
              <span className={styles.sectionLabel}>
                HOY · {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
              </span>
              <span className={styles.sectionBadge}>{dueToday.length}</span>
            </div>
            {dueToday.length === 0
              ? <div className={styles.sectionEmpty}>Sin actividades para hoy.</div>
              : dueToday.map(act => (
                <ActivityRow
                  key={act.id}
                  act={act}
                  today={today}
                  fading={fadingIds.has(act.id)}
                  onToggleDone={handleToggleDone}
                  onOpenOpp={openOpp}
                />
              ))
            }
          </div>

          {/* Próximas */}
          {upcomingByDate.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader} onClick={() => toggleCollapse('upcoming')}>
                <span className={styles.sectionLabel}>Próximas</span>
                <span className={styles.sectionBadge}>{upcoming.length}</span>
                <span className={styles.collapseIcon}>{collapsed.upcoming ? '▶' : '▼'}</span>
              </div>
              {!collapsed.upcoming && upcomingByDate.map(({ date, acts }) => (
                <div key={date}>
                  <div className={styles.subDateHeader}>{formatDateHeader(date)}</div>
                  {acts.map(act => (
                    <ActivityRow
                      key={act.id}
                      act={act}
                      today={today}
                      fading={fadingIds.has(act.id)}
                      onToggleDone={handleToggleDone}
                      onOpenOpp={openOpp}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Sin fecha */}
          {noDate.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader} onClick={() => toggleCollapse('noDate')}>
                <span className={styles.sectionLabel}>Sin fecha</span>
                <span className={styles.sectionBadge}>{noDate.length}</span>
                <span className={styles.collapseIcon}>{collapsed.noDate ? '▶' : '▼'}</span>
              </div>
              {!collapsed.noDate && noDate.map(act => (
                <ActivityRow
                  key={act.id}
                  act={act}
                  today={today}
                  fading={fadingIds.has(act.id)}
                  onToggleDone={handleToggleDone}
                  onOpenOpp={openOpp}
                />
              ))}
            </div>
          )}
        </div>

      ) : (

        /* ── CALENDAR ──────────────────────────────────────────── */
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className={styles.calWrap}>

            {/* Calendar navigation */}
            <Card style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <Button variant="ghost" size="sm" onClick={() => setWeekOffset(w => w - 1)}>← Anterior</Button>
              <span className={styles.calTitle}>{formatWeekTitle(weekDates)}</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {weekOffset !== 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>Hoy</Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setWeekOffset(w => w + 1)}>Siguiente →</Button>
              </div>
            </Card>

            {/* Calendar grid */}
            <div className={styles.calGrid}>
              {weekDates.map((date, i) => {
                const iso     = weekISOs[i]
                const isToday = iso === today
                const dayActs = localActs.filter(a => a.due_date === iso)
                return (
                  <CalColumn key={iso} colId={iso} dayName={DAY_NAMES[i]} dayNum={date.getDate()} isToday={isToday}>
                    {dayActs.map(act => <CalCard key={act.id} act={act} />)}
                  </CalColumn>
                )
              })}

              {/* Sin fecha column */}
              <CalColumn colId="cal-no-date" dayName="Sin" dayNum="—" isToday={false} isNoDate>
                {localActs.filter(a => !a.due_date).map(act => <CalCard key={act.id} act={act} />)}
              </CalColumn>
            </div>
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
            {activeAct && (
              <div style={{ transform: 'rotate(3deg)', opacity: 0.95 }}>
                <CalCard act={activeAct} isOverlay />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Opportunity drawer (opened from activity rows) */}
      <OpportunityDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        opportunity={drawerOpen ? selectedOpp : null}
        onCreate={async () => {}}
        onUpdate={updateOpportunity}
        onDelete={async (id) => { await deleteOpportunity(id); closeDrawer() }}
      />

      {/* New activity modal */}
      <NewActivityModal
        isOpen={newActivityOpen}
        onClose={onNewActivityClose}
        refetch={refetch}
      />
    </div>
  )
}
