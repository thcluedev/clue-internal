import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DndContext, DragOverlay,
  useSensor, useSensors, PointerSensor,
  useDraggable, useDroppable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useOpportunities } from '../../hooks/useOpportunities'
import { Button, Card, Badge, ProfileAvatar } from '../../components/ui'
import { OpportunityDrawer } from './OpportunityDrawer'
import styles from './CRM.module.css'

/* ── Constants ─────────────────────────────────────────────── */
const STAGES = [
  { id: 'prospecto',  label: 'Prospecto' },
  { id: 'contactado', label: 'Contactado' },
  { id: 'cotizado',   label: 'Cotizado' },
  { id: 'cerrado',    label: 'Cerrado' },
  { id: 'perdido',    label: 'Perdido' },
]

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
  const svc = SERVICE_STYLE[opp.service]

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
  const { opportunities, loading, createOpportunity, updateOpportunity, deleteOpportunity } = useOpportunities()

  const [localOpps, setLocalOpps]       = useState([])
  const [serviceFilter, setServiceFilter] = useState('todos')
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [selectedOppId, setSelectedOppId] = useState(null)
  const [pendingMove, setPendingMove]   = useState(null)
  const [activeId, setActiveId]         = useState(null)

  // Derived selected opp — stays fresh after updates
  const selectedOpp = useMemo(
    () => selectedOppId ? (localOpps.find(o => o.id === selectedOppId) ?? null) : null,
    [selectedOppId, localOpps]
  )

  const activeOpp = useMemo(
    () => activeId ? localOpps.find(o => o.id === activeId) : null,
    [activeId, localOpps]
  )

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

    // Optimistic update
    setLocalOpps(prev => prev.map(o =>
      o.id === active.id ? { ...o, stage: toStage } : o
    ))

    setPendingMove({ oppId: active.id, fromStage, toStage, title: opp.title })
  }, [localOpps])

  const handleConfirmMove = async () => {
    if (!pendingMove) return
    await updateOpportunity(pendingMove.oppId, { stage: pendingMove.toStage })
    setPendingMove(null)
  }

  const openDrawer = (opp) => {
    setSelectedOppId(opp?.id ?? null)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedOppId(null)
  }

  const stageLabelFor = (id) => STAGES.find(s => s.id === id)?.label || id

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

  return (
    <div id="crm-page" className={styles.page}>

      {/* Topbar */}
      <Card
        id="crm-topbar"
        style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>
          02 — CRM · PIPELINE
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
      </Card>

      {/* Kanban board */}
      {loading ? (
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
            {STAGES.map(({ id, label }) => (
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
      )}

      {/* Toast de confirmación */}
      {pendingMove && (
        <div id="crm-move-toast" className={styles.toast}>
          <p className={styles.toastText}>
            ¿Mover <strong>"{pendingMove.title}"</strong> a{' '}
            <strong>{stageLabelFor(pendingMove.toStage)}</strong>?
          </p>
          <div className={styles.toastActions}>
            <Button variant="ghost" size="sm" onClick={handleCancelMove}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleConfirmMove}>Confirmar</Button>
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
