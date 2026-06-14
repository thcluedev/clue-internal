import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  DndContext, DragOverlay,
  useSensor, useSensors, PointerSensor,
  useDraggable, useDroppable,
} from '@dnd-kit/core'
import { useOpportunities, STAGE_CONFIG, STAGE_ORDER } from '../../hooks/useOpportunities'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Button, Card, ProfileAvatar } from '../../components/ui'
import { OpportunityDrawer } from './OpportunityDrawer'
import { ActivitiesView } from './ActivitiesView'
import styles from './CRM.module.css'

/* ── Constants ─────────────────────────────────────────────── */
const ALL_STAGES     = STAGE_ORDER.map(id => ({ id, ...STAGE_CONFIG[id] }))
const DEFAULT_VISIBLE = ['calificado','pendiente_presupuesto','cotizado','negociacion','ganado','perdido']

const SERVICES = ['todos', 'odoo', 'sistemas', 'web', 'ecommerce']

const SERVICE_STYLE = {
  odoo:      { background: 'rgba(59,130,246,0.22)',  border: '1px solid rgba(59,130,246,0.44)',  color: '#60a5fa' },
  sistemas:  { background: 'rgba(139,92,246,0.22)',  border: '1px solid rgba(139,92,246,0.44)',  color: '#a78bfa' },
  web:       { background: 'rgba(232,76,30,0.22)',   border: '1px solid rgba(232,76,30,0.44)',   color: '#fb7c52' },
  ecommerce: { background: 'rgba(72,187,100,0.22)',  border: '1px solid rgba(72,187,100,0.44)',  color: '#6dd68a' },
}

/* ── Helpers ───────────────────────────────────────────────── */
function formatAmount(amount, currency) {
  if (!amount && amount !== 0) return null
  return `${currency} ${Number(amount).toLocaleString('es-AR')}`
}

function formatCloseDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return `Cierra ${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`
}

/* ── OppCardContent — pure display ────────────────────────── */
function OppCardContent({ opp, isOverlay = false, dragListeners, dragAttributes, dragRef, isDragging }) {
  const navigate     = useNavigate()
  const svc          = SERVICE_STYLE[opp.service]
  const pendingCount = opp.activities?.filter(a => !a.done).length || 0

  return (
    <div
      ref={dragRef}
      className={`
        ${styles.oppCard}
        ${isDragging ? styles.oppCardGhost : ''}
        ${isOverlay ? styles.oppCardOverlay : ''}
      `}
    >
      <div className={styles.oppCardTop}>
        <span
          className={styles.dragHandle}
          {...(dragListeners || {})}
          {...(dragAttributes || {})}
          onClick={e => e.stopPropagation()}
        >
          ⠿
        </span>
        <span className={styles.oppTitle}>{opp.title}</span>
      </div>

      <div className={styles.oppMeta}>
        <span className={styles.oppCompany}>
          {opp.companies?.name || '—'}
        </span>
      </div>

      <div className={styles.oppFooter}>
        {opp.service && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: '100px',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontWeight: 500,
            flexShrink: 0,
            ...svc,
          }}>
            {opp.service}
          </span>
        )}

        <ProfileAvatar userId={opp.assigned_to} size="xs" showName />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
          {opp.amount > 0 && (
            <span className={styles.oppAmount}>
              {formatAmount(opp.amount, opp.currency)}
            </span>
          )}
          {opp.close_date && (
            <span className={styles.oppDate}>
              {formatCloseDate(opp.close_date)}
            </span>
          )}
        </div>
      </div>

      {opp.stage === 'ganado' && (
        <button
          onClick={e => {
            e.stopPropagation()
            navigate(`/proyectos?opp_id=${opp.id}&nombre=${encodeURIComponent(opp.title)}&empresa=${encodeURIComponent(opp.companies?.name || '')}`)
          }}
          style={{
            display: 'block',
            marginLeft: '22px',
            marginTop: '4px',
            background: 'transparent',
            border: '1px solid rgba(74,154,90,0.35)',
            borderRadius: '100px',
            padding: '3px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: '#4a9a5a',
            cursor: 'pointer',
            transition: 'all 0.15s',
            textAlign: 'left',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,154,90,0.10)'; e.currentTarget.style.borderColor = 'rgba(74,154,90,0.60)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(74,154,90,0.35)' }}
        >
          Crear proyecto →
        </button>
      )}

      {pendingCount > 0 && (
        <span
          className={styles.actDot}
          title={`${pendingCount} actividad${pendingCount !== 1 ? 'es' : ''} pendiente${pendingCount !== 1 ? 's' : ''}`}
        />
      )}
    </div>
  )
}

/* ── DraggableCard ─────────────────────────────────────────── */
function DraggableCard({ opp, onOpen }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: opp.id,
    data: { stage: opp.stage },
  })

  return (
    <div onClick={() => !isDragging && onOpen(opp)}>
      <OppCardContent
        opp={opp}
        dragRef={setNodeRef}
        dragListeners={listeners}
        dragAttributes={attributes}
        isDragging={isDragging}
      />
    </div>
  )
}

/* ── KanbanColumn ──────────────────────────────────────────── */
function KanbanColumn({ stage, label, opps, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  const arsTotal = opps.filter(o => o.currency === 'ARS').reduce((s, o) => s + (Number(o.amount) || 0), 0)
  const usdTotal = opps.filter(o => o.currency === 'USD').reduce((s, o) => s + (Number(o.amount) || 0), 0)

  return (
    <div className={`${styles.column} ${isOver ? styles.columnOver : ''}`}>
      <div className={styles.columnHeader}>
        <span className={styles.columnName}>{label}</span>
        <div className={styles.columnMeta}>
          <span className={styles.columnCount}>{opps.length}</span>
          <div className={styles.columnValues}>
            {arsTotal === 0 && usdTotal === 0 && (
              <span className={styles.columnValue}>—</span>
            )}
            {arsTotal > 0 && (
              <span className={`${styles.columnValue} ${styles.columnValueActive}`}>
                ARS {arsTotal.toLocaleString('es-AR')}
              </span>
            )}
            {usdTotal > 0 && (
              <span className={`${styles.columnValue} ${styles.columnValueActive}`}>
                USD {usdTotal.toLocaleString('en-US')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div ref={setNodeRef} className={styles.columnBody}>
        {opps.length === 0 ? (
          <div className={styles.emptyCol}>Sin oportunidades</div>
        ) : (
          opps.map(opp => (
            <DraggableCard key={opp.id} opp={opp} onOpen={onOpen} />
          ))
        )}
      </div>
    </div>
  )
}

/* ── CRM page ──────────────────────────────────────────────── */
export default function CRM() {
  const { opportunities, loading, createOpportunity, updateOpportunity, deleteOpportunity, changeStage } = useOpportunities()
  const { user } = useAuth()
  const popoverAnchorRef = useRef(null)
  const popoverRef      = useRef(null)
  const [popoverPos, setPopoverPos] = useState(null)

  const [activeTab, setActiveTab]         = useState('pipeline')
  const [newActivityOpen, setNewActivityOpen] = useState(false)
  const [localOpps, setLocalOpps]         = useState([])
  const [serviceFilter, setServiceFilter] = useState('todos')
  const [drawerOpen, setDrawerOpen]       = useState(false)
  const [selectedOppId, setSelectedOppId] = useState(null)
  const [pendingMove, setPendingMove]     = useState(null)
  const [activeId, setActiveId]           = useState(null)
  const [visibleStages, setVisibleStages] = useState(DEFAULT_VISIBLE)
  const [showPopover, setShowPopover]     = useState(false)
  const [moveError, setMoveError]         = useState(null)

  // Derived selected opp — stays fresh after updates
  const selectedOpp = useMemo(
    () => selectedOppId ? (localOpps.find(o => o.id === selectedOppId) ?? null) : null,
    [selectedOppId, localOpps]
  )

  const activeOpp = useMemo(
    () => activeId ? localOpps.find(o => o.id === activeId) : null,
    [activeId, localOpps]
  )

  // Load kanban columns preference from profile
  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').select('kanban_columns').eq('id', user.id).single()
      .then(({ data }) => {
        if (Array.isArray(data?.kanban_columns) && data.kanban_columns.length >= 2)
          setVisibleStages(data.kanban_columns)
      })
  }, [user?.id])

  // Popover outside-click — checks both anchor and portal content
  useEffect(() => {
    if (!showPopover) return
    const handler = (e) => {
      if (
        !popoverRef.current?.contains(e.target) &&
        !popoverAnchorRef.current?.contains(e.target)
      ) setShowPopover(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPopover])

  const handleTogglePopover = () => {
    if (!showPopover && popoverAnchorRef.current) {
      const rect = popoverAnchorRef.current.getBoundingClientRect()
      setPopoverPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
    setShowPopover(p => !p)
  }

  // Sync localOpps from server when no pending move
  useEffect(() => {
    if (!pendingMove) setLocalOpps(opportunities)
  }, [opportunities, pendingMove])

  // Auto-cancel pending move after 8s
  const handleCancelMove = useCallback(() => {
    if (!pendingMove) return
    setLocalOpps(prev => prev.map(o =>
      o.id === pendingMove.oppId ? { ...o, stage: pendingMove.fromStage } : o
    ))
    setPendingMove(null)
  }, [pendingMove])

  useEffect(() => {
    if (!pendingMove) return
    const t = setTimeout(handleCancelMove, 8000)
    return () => clearTimeout(t)
  }, [pendingMove, handleCancelMove])

  // DnD sensors — 8px distance prevents accidental drag on click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = useCallback(({ active }) => {
    setActiveId(active.id)
  }, [])

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveId(null)
    if (!over) return

    const fromStage = active.data.current?.stage
    const toStage = over.id
    if (!fromStage || fromStage === toStage) return

    const opp = localOpps.find(o => o.id === active.id)
    if (!opp) return

    const isBackward = STAGE_ORDER.indexOf(toStage) < STAGE_ORDER.indexOf(fromStage) && toStage !== 'perdido'

    // Optimistic update
    setLocalOpps(prev => prev.map(o =>
      o.id === active.id ? { ...o, stage: toStage } : o
    ))

    setPendingMove({ oppId: active.id, fromStage, toStage, title: opp.title, isBackward })
  }, [localOpps])

  const handleConfirmMove = async () => {
    if (!pendingMove) return
    const opp = localOpps.find(o => o.id === pendingMove.oppId)
    const { error } = await changeStage(opp, pendingMove.toStage)
    if (error) {
      setLocalOpps(prev => prev.map(o =>
        o.id === pendingMove.oppId ? { ...o, stage: pendingMove.fromStage } : o
      ))
      setMoveError(error)
      setTimeout(() => setMoveError(null), 5000)
    }
    setPendingMove(null)
  }

  const saveKanbanPreference = (columns) => {
    if (!user?.id) return
    supabase.from('profiles').update({ kanban_columns: columns }).eq('id', user.id)
  }

  const openDrawer = (opp) => {
    setSelectedOppId(opp?.id ?? null)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedOppId(null)
  }

  const stageLabelFor = (id) => STAGE_CONFIG[id]?.label || id

  // Filter + group
  const filtered = useMemo(() =>
    serviceFilter === 'todos'
      ? localOpps
      : localOpps.filter(o => o.service === serviceFilter),
    [localOpps, serviceFilter]
  )

  const oppsByStage = useCallback(
    (stage) => filtered.filter(o => o.stage === stage),
    [filtered]
  )

  const visibleCols = ALL_STAGES.filter(s => visibleStages.includes(s.id))

  return (
    <div id="crm-page" className={styles.page}>

      {/* Topbar */}
      <Card
        id="crm-topbar"
        style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>
            02 — CRM
          </span>
          <Button
            id="crm-tab-pipeline"
            variant={activeTab === 'pipeline' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('pipeline')}
          >Pipeline</Button>
          <Button
            id="crm-tab-actividades"
            variant={activeTab === 'actividades' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('actividades')}
          >Actividades</Button>
        </div>

        {activeTab === 'pipeline' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Personalizar vista */}
            <div ref={popoverAnchorRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTogglePopover}
                style={showPopover ? { borderColor: 'rgba(255,255,255,0.25)', color: 'var(--off-white)' } : {}}
              >
                ⚙ Vista
              </Button>
            </div>

            {/* Popover via portal — escapa el stacking context de backdrop-filter */}
            {showPopover && popoverPos && createPortal(
              <div
                ref={popoverRef}
                style={{
                  position: 'fixed',
                  top: popoverPos.top,
                  right: popoverPos.right,
                  zIndex: 9999,
                  background: 'rgba(20,18,16,0.97)',
                  backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: '12px',
                  padding: '8px 0',
                  minWidth: '200px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.40)',
                }}
              >
                <div style={{ padding: '6px 14px 8px', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  Columnas visibles
                </div>
                {ALL_STAGES.map(({ id, label, color }) => {
                  const checked = visibleStages.includes(id)
                  return (
                    <label
                      key={id}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 14px', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? visibleStages.filter(s => s !== id)
                            : [...visibleStages, id]
                          if (next.length < 2) return
                          const ordered = STAGE_ORDER.filter(s => next.includes(s))
                          setVisibleStages(ordered)
                          saveKanbanPreference(ordered)
                        }}
                        style={{ accentColor: color, width: '14px', height: '14px', cursor: 'pointer' }}
                      />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: checked ? color : 'var(--stone)', transition: 'color 0.12s' }}>
                        {label}
                      </span>
                    </label>
                  )
                })}
              </div>,
              document.body
            )}

            <div id="crm-service-filters" className={styles.serviceFilters}>
              {SERVICES.map(s => (
                <Button
                  key={s}
                  id={`crm-filter-${s}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => setServiceFilter(serviceFilter === s ? 'todos' : s)}
                  style={serviceFilter === s
                    ? { borderColor: 'var(--ember-border)', color: 'var(--ember)', background: 'var(--ember-dim)' }
                    : {}
                  }
                >
                  {s === 'todos' ? 'Todos' : s === 'ecommerce' ? 'E-commerce' : s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
            <Button id="crm-btn-new" variant="primary" size="sm" onClick={() => openDrawer(null)}>
              + Nueva oportunidad
            </Button>
          </div>
        )}

        {activeTab === 'actividades' && (
          <Button
            id="crm-btn-new-activity"
            variant="primary"
            size="sm"
            onClick={() => setNewActivityOpen(true)}
          >
            + Nueva actividad
          </Button>
        )}
      </Card>

      {/* Pipeline */}
      {activeTab === 'pipeline' && (
        loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone)', letterSpacing: '0.08em' }}>
            CARGANDO...
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div id="crm-board" className={styles.board}>
              {visibleCols.map(({ id, label }) => (
                <KanbanColumn
                  key={id}
                  stage={id}
                  label={label}
                  opps={oppsByStage(id)}
                  onOpen={openDrawer}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
              {activeOpp ? (
                <OppCardContent opp={activeOpp} isOverlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        )
      )}

      {/* Activities view */}
      {activeTab === 'actividades' && (
        <ActivitiesView
          newActivityOpen={newActivityOpen}
          onNewActivityClose={() => setNewActivityOpen(false)}
        />
      )}

      {/* Toast de confirmación (pipeline only) */}
      {activeTab === 'pipeline' && pendingMove && (
        <div id="crm-move-toast" className={styles.toast}>
          <p className={styles.toastText}>
            ¿{pendingMove.isBackward ? 'Retroceder' : 'Mover'} <strong>"{pendingMove.title}"</strong> a{' '}
            <strong>{stageLabelFor(pendingMove.toStage)}</strong>?
          </p>
          <div className={styles.toastActions}>
            <Button variant="ghost" size="sm" onClick={handleCancelMove}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleConfirmMove}>Confirmar</Button>
          </div>
        </div>
      )}

      {/* Error toast */}
      {moveError && (
        <div id="crm-error-toast" className={styles.toast} style={{ background: 'rgba(30,10,10,0.97)', borderColor: 'rgba(248,113,113,0.30)' }}>
          <p className={styles.toastText} style={{ color: '#fca5a5' }}>{moveError}</p>
          <div className={styles.toastActions}>
            <Button variant="ghost" size="sm" onClick={() => setMoveError(null)}>Cerrar</Button>
          </div>
        </div>
      )}

      {/* Drawer */}
      <OpportunityDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        opportunity={drawerOpen && selectedOppId === null ? null : selectedOpp}
        onCreate={createOpportunity}
        onUpdate={updateOpportunity}
        onDelete={deleteOpportunity}
      />
    </div>
  )
}
