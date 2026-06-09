import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../../hooks/useDashboard'
import { useAuth } from '../../hooks/useAuth'
import styles from './Dashboard.module.css'

/* ── Helpers ───────────────────────────────────────────────── */
function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 2)  return 'ahora'
  if (mins  < 60) return `hace ${mins}m`
  if (hours < 24) return `hace ${hours}h`
  if (days  < 7)  return `hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function formatQuoteNum(n) {
  return `COT-${String(n || 0).padStart(3, '0')}`
}

function calcQuoteTotal(items) {
  if (!Array.isArray(items)) return 0
  return items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0)
}

const STAGE_STYLE = {
  prospecto:  { background: 'rgba(154,148,137,0.20)', border: '1px solid rgba(154,148,137,0.40)', color: '#b8b2ab' },
  contactado: { background: 'rgba(79,142,255,0.18)',  border: '1px solid rgba(79,142,255,0.38)',  color: '#82b4ff' },
  cotizado:   { background: 'rgba(251,191,36,0.18)',  border: '1px solid rgba(251,191,36,0.38)',  color: '#fcd34d' },
  cerrado:    { background: 'rgba(72,187,100,0.22)',  border: '1px solid rgba(72,187,100,0.45)',  color: '#7edda0' },
  perdido:    { background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.38)', color: '#fca5a5' },
}

const QUOTE_STATUS_STYLE = {
  borrador:  { background: 'rgba(154,148,137,0.18)', border: '1px solid rgba(154,148,137,0.35)', color: '#b8b2ab' },
  enviada:   { background: 'rgba(59,130,246,0.18)',  border: '1px solid rgba(59,130,246,0.40)',  color: '#60a5fa' },
  aceptada:  { background: 'rgba(72,187,100,0.18)',  border: '1px solid rgba(72,187,100,0.40)',  color: '#7edda0' },
  rechazada: { background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.40)', color: '#fca5a5' },
}

const COMPANY_TYPE_STYLE = {
  cliente:   { background: 'rgba(72,187,100,0.18)',   border: '1px solid rgba(72,187,100,0.40)',   color: '#7edda0' },
  prospecto: { background: 'rgba(79,142,255,0.18)',   border: '1px solid rgba(79,142,255,0.38)',   color: '#82b4ff' },
  proveedor: { background: 'rgba(200,196,188,0.15)',  border: '1px solid rgba(200,196,188,0.32)',  color: '#d4d0ca' },
}

/* ── SmallBadge ────────────────────────────────────────────── */
function SmallBadge({ bStyle, children }) {
  return (
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
      ...(bStyle || {}),
    }}>
      {children}
    </span>
  )
}

/* ── MiniProgressBar ───────────────────────────────────────── */
function MiniProgressBar({ tasks }) {
  const total = tasks?.length || 0
  const done  = tasks?.filter(t => t.stage === 'hecho').length || 0
  const pct   = total > 0 ? (done / total) * 100 : 0
  return (
    <div className={styles.miniProgressBar}>
      <div className={styles.miniProgressFill} style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ── SkeletonRows ──────────────────────────────────────────── */
function SkeletonRows({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ padding: '10px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className={styles.skeletonLine} style={{ height: '12px', width: `${52 + (i % 3) * 12}%` }} />
            <div className={styles.skeletonLine} style={{ height: '10px', width: `${30 + (i % 2) * 15}%`, opacity: 0.6 }} />
          </div>
          <div className={styles.skeletonLine} style={{ height: '20px', width: '52px', borderRadius: '100px' }} />
        </div>
      ))}
    </>
  )
}

/* ── ActivityCard ──────────────────────────────────────────── */
function ActivityCard({ id, label, linkLabel, onLinkClick, children }) {
  return (
    <div id={id} className={styles.activityCard}>
      <div className={styles.cardHeader}>
        <span className={styles.cardLabel}>{label}</span>
        <button className={styles.cardLink} onClick={onLinkClick}>{linkLabel} →</button>
      </div>
      {children}
    </div>
  )
}

/* ── Dashboard ─────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate        = useNavigate()
  const { data, loading } = useDashboard()
  const { user }        = useAuth()

  const hour     = new Date().getHours()
  const greeting = hour >= 6 && hour < 12 ? 'Buenos días'
    : hour >= 12 && hour < 20 ? 'Buenas tardes'
    : 'Buenas noches'
  const username  = user?.email?.split('@')[0] || 'equipo'
  const dateLabel = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date())

  const STATS = [
    { id: 'stat-opps',     label: 'Oportunidades abiertas', value: data?.openOppsCount       ?? '—', sub: 'activas'   },
    { id: 'stat-projects', label: 'Proyectos activos',      value: data?.activeProjectsCount ?? '—', sub: 'en curso'  },
    { id: 'stat-quotes',   label: 'Cotizaciones enviadas',  value: data?.pendingQuotesCount  ?? '—', sub: 'pendientes' },
    { id: 'stat-contacts', label: 'Contactos totales',      value: data?.companiesCount      ?? '—', sub: 'empresas'  },
  ]

  return (
    <div id="dashboard-page" className={styles.page}>

      {/* ── Header ── */}
      <div id="dashboard-header">
        <h1 className={styles.greeting}>{greeting}, {username}.</h1>
        <p className={styles.greetingDate}>{dateLabel}</p>
      </div>

      {/* ── Stats ── */}
      <div id="dashboard-stats" className={styles.stats}>
        {STATS.map(s => (
          <div key={s.id} id={s.id} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            {loading
              ? <div className={styles.skeletonLine} style={{ height: '30px', width: '48px', marginTop: '4px' }} />
              : <div className={styles.statValue}>{s.value}</div>
            }
            <div className={styles.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Activity grid ── */}
      <div id="dashboard-grid" className={styles.grid}>

        {/* Left column — Oportunidades + Cotizaciones */}
        <div className={styles.col}>

          <ActivityCard
            id="dash-opps-card"
            label="Oportunidades recientes"
            linkLabel="Ver CRM"
            onLinkClick={() => navigate('/crm')}
          >
            {loading ? <SkeletonRows count={4} /> : data.recentOpps.length === 0
              ? <div className={styles.emptyState}>Sin oportunidades todavía.</div>
              : data.recentOpps.map(opp => (
                <div
                  key={opp.id}
                  id={`dash-opp-${opp.id}`}
                  className={styles.activityRow}
                  onClick={() => navigate('/crm')}
                >
                  <div className={styles.rowMain}>
                    <div className={styles.rowName}>{opp.companies?.name || '—'}</div>
                    <div className={styles.rowMeta}>{opp.title}</div>
                  </div>
                  <div className={styles.rowRight}>
                    <SmallBadge bStyle={STAGE_STYLE[opp.stage] || STAGE_STYLE.prospecto}>{opp.stage}</SmallBadge>
                    {opp.amount
                      ? <span className={styles.rowAmount}>{opp.currency} {Number(opp.amount).toLocaleString('es-AR')}</span>
                      : null
                    }
                    <span className={styles.rowDate}>{timeAgo(opp.created_at)}</span>
                  </div>
                </div>
              ))
            }
          </ActivityCard>

          <ActivityCard
            id="dash-quotes-card"
            label="Cotizaciones recientes"
            linkLabel="Ver todas"
            onLinkClick={() => navigate('/cotizaciones')}
          >
            {loading ? <SkeletonRows count={4} /> : data.recentQuotes.length === 0
              ? <div className={styles.emptyState}>Sin cotizaciones todavía.</div>
              : data.recentQuotes.map(quote => {
                const total  = calcQuoteTotal(quote.items)
                const qStyle = QUOTE_STATUS_STYLE[quote.status] || QUOTE_STATUS_STYLE.borrador
                return (
                  <div
                    key={quote.id}
                    id={`dash-quote-${quote.id}`}
                    className={styles.activityRow}
                    onClick={() => navigate(`/cotizaciones/${quote.id}`)}
                  >
                    <div className={styles.rowMain}>
                      <div className={styles.rowName}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ember)', flexShrink: 0 }}>
                          {formatQuoteNum(quote.number)}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {quote.companies?.name || '—'}
                        </span>
                      </div>
                      <div className={styles.rowMeta}>
                        {quote.currency} {total.toLocaleString('es-AR')}
                      </div>
                    </div>
                    <div className={styles.rowRight}>
                      <SmallBadge bStyle={qStyle}>{quote.status}</SmallBadge>
                      <span className={styles.rowDate}>{timeAgo(quote.created_at)}</span>
                    </div>
                  </div>
                )
              })
            }
          </ActivityCard>
        </div>

        {/* Right column — Proyectos + Contactos */}
        <div className={styles.col}>

          <ActivityCard
            id="dash-projects-card"
            label="Proyectos activos"
            linkLabel="Ver todos"
            onLinkClick={() => navigate('/proyectos')}
          >
            {loading ? <SkeletonRows count={3} /> : data.activeProjects.length === 0
              ? <div className={styles.emptyState}>Sin proyectos activos.</div>
              : data.activeProjects.map(project => {
                const total      = project.tasks?.length || 0
                const done       = project.tasks?.filter(t => t.stage === 'hecho').length || 0
                const inProgress = project.tasks?.filter(t => t.stage === 'en_progreso').length || 0
                return (
                  <div
                    key={project.id}
                    id={`dash-project-${project.id}`}
                    className={styles.activityRow}
                    onClick={() => navigate(`/proyectos/${project.id}`)}
                  >
                    <div className={styles.rowMain}>
                      <div className={styles.rowName}>{project.name}</div>
                      <div className={styles.rowMeta}>{project.companies?.name || 'Proyecto interno'}</div>
                      <MiniProgressBar tasks={project.tasks} />
                      <div className={styles.rowMeta} style={{ marginTop: '3px' }}>
                        {inProgress} tarea{inProgress !== 1 ? 's' : ''} en progreso
                      </div>
                    </div>
                    <div className={styles.rowRight}>
                      <span className={styles.rowDate} style={{ fontSize: '11px', color: 'var(--stone)' }}>{done}/{total}</span>
                    </div>
                  </div>
                )
              })
            }
          </ActivityCard>

          <ActivityCard
            id="dash-contacts-card"
            label="Contactos recientes"
            linkLabel="Ver todos"
            onLinkClick={() => navigate('/contactos')}
          >
            {loading ? <SkeletonRows count={4} /> : data.recentContacts.length === 0
              ? <div className={styles.emptyState}>Sin empresas todavía.</div>
              : data.recentContacts.map(company => {
                const initials = company.name
                  ? company.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                  : '?'
                const cStyle = COMPANY_TYPE_STYLE[company.type] || COMPANY_TYPE_STYLE.prospecto
                return (
                  <div
                    key={company.id}
                    id={`dash-contact-${company.id}`}
                    className={styles.activityRow}
                    onClick={() => navigate('/contactos')}
                  >
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '100px', flexShrink: 0,
                      background: 'var(--ember-dim)', border: '1px solid var(--ember-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ember)',
                    }}>
                      {initials}
                    </div>
                    <div className={styles.rowMain}>
                      <div className={styles.rowName}>{company.name}</div>
                    </div>
                    <div className={styles.rowRight}>
                      <SmallBadge bStyle={cStyle}>{company.type}</SmallBadge>
                      <span className={styles.rowDate}>{timeAgo(company.created_at)}</span>
                    </div>
                  </div>
                )
              })
            }
          </ActivityCard>
        </div>
      </div>
    </div>
  )
}
