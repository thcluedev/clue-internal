import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuotes } from '../../hooks/useQuotes'
import { Button, Card, Badge } from '../../components/ui'
import { pdf } from '@react-pdf/renderer'
import { QuotePDF } from './QuotePDF'
import { EstimacionesView } from './EstimacionesView'
import styles from './Quotes.module.css'

/* ── Constants ─────────────────────────────────────────────── */
const STATUSES = ['todos', 'borrador', 'enviada', 'aceptada', 'rechazada']

const STATUS_STYLE = {
  borrador:   { background: 'rgba(154,148,137,0.18)', border: '1px solid rgba(154,148,137,0.35)', color: '#b8b2ab' },
  enviada:    { background: 'rgba(59,130,246,0.18)',  border: '1px solid rgba(59,130,246,0.40)',  color: '#60a5fa' },
  aceptada:   { background: 'rgba(72,187,100,0.18)',  border: '1px solid rgba(72,187,100,0.40)',  color: '#7edda0' },
  rechazada:  { background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.40)', color: '#fca5a5' },
}

/* ── Helpers ───────────────────────────────────────────────── */
function formatQuoteNum(n) {
  return `COT-${String(n || 0).padStart(3, '0')}`
}

function calcTotal(items) {
  if (!Array.isArray(items)) return 0
  return items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0)
}

function formatAmount(amount, currency) {
  return `${currency || 'ARS'} ${Number(amount).toLocaleString('es-AR')}`
}

function calcExpiry(createdAt, validDays) {
  if (!createdAt) return null
  return new Date(new Date(createdAt).getTime() + (validDays || 15) * 86400000)
}

/* ── Component ─────────────────────────────────────────────── */
export default function Quotes() {
  const { quotes, loading } = useQuotes()
  const navigate = useNavigate()
  const [activeTab, setActiveTab]       = useState('cotizaciones')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [downloading, setDownloading]   = useState(null)

  const filtered = useMemo(() =>
    statusFilter === 'todos' ? quotes : quotes.filter(q => q.status === statusFilter),
    [quotes, statusFilter]
  )

  const handleDownloadPDF = async (quote) => {
    setDownloading(quote.id)
    try {
      const blob = await pdf(
        <QuotePDF quote={quote} company={quote.companies} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${formatQuoteNum(quote.number)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('PDF error:', e)
    }
    setDownloading(null)
  }

  return (
    <div id="quotes-page" className={styles.page}>

      {/* Topbar */}
      <Card
        id="quotes-topbar"
        style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>
            03 — COTIZACIONES
          </span>
          <Button
            variant={activeTab === 'cotizaciones' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('cotizaciones')}
          >Cotizaciones</Button>
          <Button
            variant={activeTab === 'estimaciones' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('estimaciones')}
          >Estimaciones</Button>
        </div>

        {activeTab === 'cotizaciones' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div id="quotes-status-filters" className={styles.statusFilters}>
              {STATUSES.map(st => (
                <Button
                  key={st}
                  id={`quotes-filter-${st}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter(statusFilter === st ? 'todos' : st)}
                  style={statusFilter === st
                    ? { borderColor: 'var(--ember-border)', color: 'var(--ember)', background: 'var(--ember-dim)' }
                    : {}
                  }
                >
                  {st === 'todos' ? 'Todas' : st.charAt(0).toUpperCase() + st.slice(1)}
                </Button>
              ))}
            </div>
            <Button id="quotes-btn-new" variant="primary" size="sm" onClick={() => navigate('/cotizaciones/nueva')}>
              + Nueva cotización
            </Button>
          </div>
        )}
      </Card>

      {/* Estimaciones tab */}
      {activeTab === 'estimaciones' && <EstimacionesView />}

      {/* Table */}
      {activeTab === 'cotizaciones' && <Card id="quotes-table" className={styles.tableWrap}>
        {/* Header */}
        <div id="quotes-table-header" className={styles.tableHeader}>
          {['NRO', 'EMPRESA', 'ESTADO', 'MON.', 'TOTAL', 'VÁLIDA HASTA', 'VINCULADA A', ''].map(col => (
            <div key={col} className={styles.colLabel}>{col}</div>
          ))}
        </div>

        {/* Body */}
        <div id="quotes-table-body" className={styles.tableBody}>
          {loading ? (
            <div className={styles.loading}>CARGANDO...</div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              {statusFilter !== 'todos' ? 'Sin cotizaciones con ese estado.' : 'Todavía no hay cotizaciones.'}
            </div>
          ) : filtered.map(quote => {
            const total   = calcTotal(quote.items)
            const expiry  = calcExpiry(quote.created_at, quote.valid_days)
            const expired = expiry && expiry < new Date() && quote.status !== 'aceptada'
            const sStyle  = STATUS_STYLE[quote.status] || STATUS_STYLE.borrador

            return (
              <div
                key={quote.id}
                id={`quote-row-${quote.id}`}
                className={styles.tableRow}
              >
                {/* NRO */}
                <div id={`quote-num-${quote.id}`} className={styles.quoteNum}>
                  {formatQuoteNum(quote.number)}
                </div>

                {/* Empresa */}
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--off-white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {quote.companies?.name || '—'}
                </div>

                {/* Estado */}
                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '3px 10px', borderRadius: '100px',
                    fontFamily: 'var(--font-mono)', fontSize: '9px',
                    letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500,
                    ...sStyle,
                  }}>
                    {quote.status || 'borrador'}
                  </span>
                </div>

                {/* Moneda */}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)' }}>
                  {quote.currency || 'ARS'}
                </div>

                {/* Total */}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--off-white)' }}>
                  {formatAmount(total, quote.currency)}
                </div>

                {/* Válida hasta */}
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px',
                  color: expired ? 'var(--ember)' : 'var(--stone)',
                }}>
                  {expiry ? expiry.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}
                </div>

                {/* Vinculada */}
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {quote.opportunities?.title || '—'}
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  <Button
                    id={`quote-btn-pdf-${quote.id}`}
                    variant="icon"
                    size="sm"
                    disabled={downloading === quote.id}
                    onClick={() => handleDownloadPDF(quote)}
                    title="Descargar PDF"
                  >
                    {downloading === quote.id ? '…' : '↓'}
                  </Button>
                  <Button
                    id={`quote-btn-open-${quote.id}`}
                    variant="icon"
                    size="sm"
                    onClick={() => navigate(`/cotizaciones/${quote.id}`)}
                    title="Editar"
                  >
                    →
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>}
    </div>
  )
}
