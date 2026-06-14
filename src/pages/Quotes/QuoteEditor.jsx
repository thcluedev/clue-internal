import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuotes } from '../../hooks/useQuotes'
import { useCompanies } from '../../hooks/useCompanies'
import { useOpportunities } from '../../hooks/useOpportunities'
import { Button, Input, Card, Select, Textarea } from '../../components/ui'
import { pdf } from '@react-pdf/renderer'
import { QuotePDF } from './QuotePDF'
import styles from './QuoteEditor.module.css'

/* ── Options ───────────────────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: 'borrador',  label: 'Borrador' },
  { value: 'enviada',   label: 'Enviada' },
  { value: 'aceptada',  label: 'Aceptada' },
  { value: 'rechazada', label: 'Rechazada' },
]

const EMPTY_ITEM    = { description: '', quantity: 1, unit_price: 0 }
const EMPTY_FORM    = { company_id: null, opportunity_id: null, status: 'borrador', currency: 'ARS', valid_days: 15, notes: '' }

function formatQuoteNum(n) {
  if (!n) return 'COT-NEW'
  return `COT-${String(n).padStart(3, '0')}`
}

function formatAmt(amount, currency) {
  return `${currency} ${Number(amount || 0).toLocaleString('es-AR')}`
}

/* ── SectionTitle ──────────────────────────────────────────── */
function SectionTitle({ children }) {
  return <div className={styles.sectionTitle}>{children}</div>
}

/* ── QuoteEditor ───────────────────────────────────────────── */
export default function QuoteEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'nueva'

  const { quotes, loading: quotesLoading, createQuote, updateQuote, deleteQuote } = useQuotes()
  const { companies } = useCompanies()
  const { opportunities } = useOpportunities()

  const quote = isNew ? null : quotes.find(q => q.id === id) ?? null

  const [initialized, setInitialized] = useState(false)
  const [items, setItems]       = useState([{ ...EMPTY_ITEM }])
  const [formData, setFormData] = useState({ ...EMPTY_FORM })
  const [saving, setSaving]     = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Initialize form from existing quote — skip entirely when creating new
  useEffect(() => {
    if (isNew) return
    if (initialized) return
    if (!quote) return
    setItems(Array.isArray(quote.items) && quote.items.length > 0 ? quote.items : [{ ...EMPTY_ITEM }])
    setFormData({
      company_id:     quote.company_id     || null,
      opportunity_id: quote.opportunity_id || null,
      status:         quote.status         || 'borrador',
      currency:       quote.currency       || 'ARS',
      valid_days:     quote.valid_days     || 15,
      notes:          quote.notes          || '',
    })
    setInitialized(true)
  }, [quote, isNew, initialized])

  // Company and opportunity selects
  const companyOptions = useMemo(() => [
    { value: null, label: 'Sin empresa' },
    ...companies.map(c => ({ value: c.id, label: c.name })),
  ], [companies])

  const oppOptions = useMemo(() => [
    { value: null, label: 'Sin oportunidad' },
    ...opportunities
      .filter(o => !formData.company_id || o.company_id === formData.company_id)
      .map(o => ({ value: o.id, label: o.title })),
  ], [opportunities, formData.company_id])

  // Total
  const total = useMemo(() =>
    items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0),
    [items]
  )

  // Form helpers
  const setField = (key, val) => setFormData(f => ({ ...f, [key]: val }))

  const handleCompanyChange = (val) => {
    setFormData(f => ({ ...f, company_id: val, opportunity_id: null }))
  }

  // Items helpers
  const addItem    = () => setItems(prev => [...prev, { ...EMPTY_ITEM }])
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx, field, value) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))

  // Save
  const handleSave = async () => {
    setSaving(true)
    const payload = {
      ...formData,
      items,
      company_id:     formData.company_id || null,
      opportunity_id: formData.opportunity_id || null,
      valid_days:     Number(formData.valid_days) || 15,
    }
    if (isNew) {
      const { data, error } = await createQuote(payload)
      if (!error && data) navigate(`/cotizaciones/${data.id}`)
    } else {
      await updateQuote(quote.id, payload)
    }
    setSaving(false)
  }

  // Delete
  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar esta cotización?\nEsta acción no se puede deshacer.`)) return
    await deleteQuote(quote.id)
    navigate('/cotizaciones')
  }

  // Download PDF
  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const company = companies.find(c => c.id === formData.company_id) || quote?.companies
      const quoteData = {
        ...(quote || {}),
        ...formData,
        items,
        number: quote?.number || null,
        created_at: quote?.created_at || new Date().toISOString(),
      }
      const blob = await pdf(<QuotePDF quote={quoteData} company={company} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${formatQuoteNum(quote?.number)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('PDF error:', e)
    }
    setDownloading(false)
  }

  // Loading state
  if (!isNew && quotesLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone)', letterSpacing: '0.08em' }}>
        CARGANDO...
      </div>
    )
  }

  // Not found — only when editing a real id that doesn't exist in the list
  if (isNew === false && !quotesLoading && !quote) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--stone)', fontSize: '12px' }}>Cotización no encontrada</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('/cotizaciones')}>← Volver</Button>
      </div>
    )
  }

  return (
    <div id="quote-editor-page" className={styles.page}>

      {/* Back bar */}
      <div id="quote-back-bar" className={styles.backBar}>
        <Button id="quote-btn-back" variant="ghost" size="sm" onClick={() => navigate('/cotizaciones')}>
          ← Volver
        </Button>
        <span className={styles.backTitle}>
          {isNew ? 'Nueva cotización' : formatQuoteNum(quote?.number)}
        </span>
      </div>

      {/* Two-column grid */}
      <div className={styles.editorGrid}>

        {/* ── LEFT COLUMN ── */}
        <div className={styles.leftCol}>

          {/* Datos generales */}
          <Card id="quote-section-general">
            <div className={styles.section}>
              <SectionTitle>Datos generales</SectionTitle>

              <Select
                id="quote-company"
                label="Empresa"
                value={formData.company_id}
                onChange={handleCompanyChange}
                options={companyOptions}
              />
              <Select
                id="quote-opportunity"
                label="Oportunidad vinculada"
                value={formData.opportunity_id}
                onChange={val => setField('opportunity_id', val)}
                options={oppOptions}
              />

              <div className={styles.formGrid2}>
                <Select
                  id="quote-status"
                  label="Estado"
                  value={formData.status}
                  onChange={val => setField('status', val)}
                  options={STATUS_OPTIONS}
                />
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px', paddingLeft: '2px' }}>
                    Moneda
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button
                      variant={formData.currency === 'ARS' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setField('currency', 'ARS')}
                    >ARS</Button>
                    <Button
                      variant={formData.currency === 'USD' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setField('currency', 'USD')}
                    >USD</Button>
                  </div>
                </div>
              </div>

              <Input
                id="quote-valid-days"
                type="number"
                label="Días de validez"
                value={formData.valid_days}
                onChange={e => setField('valid_days', e.target.value)}
                fieldStyle={{ maxWidth: '120px' }}
              />

              <Textarea
                id="quote-notes"
                label="Notas y condiciones"
                placeholder="Condiciones comerciales, formas de pago, etc."
                value={formData.notes}
                onChange={e => setField('notes', e.target.value)}
                resize={false}
                minHeight="80px"
              />
            </div>
          </Card>

          {/* Items builder */}
          <Card id="quote-section-items">
            <div className={styles.section}>
              <SectionTitle>Ítems</SectionTitle>

              {/* Header */}
              <div className={styles.itemsHeader}>
                <div className={styles.colLabel} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Descripción</div>
                <div className={styles.colLabel} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Cant.</div>
                <div className={styles.colLabel} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>P. Unit.</div>
                <div className={styles.colLabel} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Subtotal</div>
                <div />
              </div>

              {/* Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((item, idx) => (
                  <div key={idx} id={`item-row-${idx}`} className={styles.itemRow}>
                    <Input
                      id={`item-desc-${idx}`}
                      placeholder="Descripción del servicio"
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                      fieldStyle={{ fontSize: '13px' }}
                    />
                    <Input
                      id={`item-qty-${idx}`}
                      type="number"
                      placeholder="1"
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', e.target.value)}
                      fieldStyle={{ textAlign: 'center', fontSize: '13px' }}
                    />
                    <Input
                      id={`item-price-${idx}`}
                      type="number"
                      placeholder="0"
                      value={item.unit_price}
                      onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                      fieldStyle={{ textAlign: 'right', fontSize: '13px' }}
                    />
                    <div id={`item-subtotal-${idx}`} className={styles.subtotal}>
                      {(Number(item.quantity) * Number(item.unit_price)).toLocaleString('es-AR')}
                    </div>
                    {items.length > 1 ? (
                      <Button
                        id={`item-btn-remove-${idx}`}
                        variant="icon"
                        size="sm"
                        onClick={() => removeItem(idx)}
                        style={{ fontSize: '14px' }}
                      >
                        ×
                      </Button>
                    ) : <div />}
                  </div>
                ))}
              </div>

              {/* Add item */}
              <div className={styles.addItemRow}>
                <Button
                  id="quote-btn-add-item"
                  variant="ghost"
                  onClick={addItem}
                  fullWidth
                  style={{ justifyContent: 'center' }}
                >
                  + Agregar ítem
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* ── RIGHT COLUMN — summary + actions ── */}
        <div className={styles.rightCol}>
          <Card id="quote-summary">
            <div className={styles.section}>

              {/* Quote number */}
              <div id="quote-summary-num" className={styles.summaryNum}>
                {isNew ? 'COT-NEW' : formatQuoteNum(quote?.number)}
              </div>

              <div className={styles.summaryDivider} />

              {/* Item list (live) */}
              <div id="quote-summary-items" className={styles.summaryItems}>
                {items.map((item, idx) => (
                  <div key={idx} className={styles.summaryItem}>
                    <span className={styles.summaryItemDesc}>
                      {item.description || `Ítem ${idx + 1}`}
                    </span>
                    <span className={styles.summaryItemAmt}>
                      {formatAmt((Number(item.quantity) || 0) * (Number(item.unit_price) || 0), formData.currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div id="quote-summary-total" className={styles.summaryTotal}>
                <span className={styles.summaryTotalLabel}>Total</span>
                <span className={styles.summaryTotalAmount}>
                  {formatAmt(total, formData.currency)}
                </span>
              </div>
              <div id="quote-summary-validity" className={styles.summaryValidity}>
                Válida por {formData.valid_days || 15} días
              </div>

              <div className={styles.summaryDivider} />

              {/* Actions */}
              <div id="quote-actions" className={styles.actions}>
                <Button
                  id="quote-btn-save"
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving}
                  loading={saving}
                  fullWidth
                >
                  {isNew ? 'Crear cotización' : 'Guardar cambios'}
                </Button>
                <Button
                  id="quote-btn-pdf"
                  variant="ghost"
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  loading={downloading}
                  fullWidth
                  style={{ justifyContent: 'center' }}
                >
                  ↓ Descargar PDF
                </Button>
                {!isNew && (
                  <Button
                    id="quote-btn-delete"
                    variant="danger"
                    onClick={handleDelete}
                    fullWidth
                    style={{ justifyContent: 'center', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginTop: '4px' }}
                  >
                    ELIMINAR COTIZACIÓN
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
