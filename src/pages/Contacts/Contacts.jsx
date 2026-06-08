import { useState, useMemo } from 'react'
import { useCompanies } from '../../hooks/useCompanies'
import { Button, Input, Card, Badge } from '../../components/ui'
import { CompanyDrawer } from './CompanyDrawer'
import styles from './Contacts.module.css'

const FILTER_TYPES = ['todos', 'cliente', 'prospecto', 'proveedor', 'otro']

function relativeDate(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`
  if (days < 30) return `hace ${Math.floor(days / 7)} sem`
  if (days < 365) return `hace ${Math.floor(days / 30)} meses`
  return `hace ${Math.floor(days / 365)} años`
}

export default function Contacts() {
  const { companies, loading, createCompany, updateCompany, deleteCompany, createContact, deleteContact } = useCompanies()

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)

  const selectedCompany = useMemo(
    () => selectedCompanyId ? (companies.find(c => c.id === selectedCompanyId) ?? null) : null,
    [selectedCompanyId, companies]
  )

  const filtered = useMemo(() =>
    companies
      .filter(c => filterType === 'todos' || c.type === filterType)
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [companies, filterType, search]
  )

  const stats = useMemo(() => ({
    total: companies.length,
    clientes: companies.filter(c => c.type === 'cliente').length,
    prospectos: companies.filter(c => c.type === 'prospecto').length,
    conContactos: companies.filter(c => (c.contacts?.length ?? 0) > 0).length,
  }), [companies])

  const openDrawer = (company) => {
    setSelectedCompanyId(company?.id ?? null)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedCompanyId(null)
  }

  return (
    <div id="contacts-page" className={styles.page}>

      {/* Topbar */}
      <Card
        id="contacts-topbar"
        style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}
      >
        <span
          id="contacts-label"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}
        >
          01 — CONTACTOS
        </span>
        <div id="contacts-topbar-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            id="contacts-search"
            placeholder="Buscar empresa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '180px' }}
            fieldStyle={{ fontSize: '12px', padding: '0.42rem 0.9rem' }}
          />
          <div id="contacts-filters" style={{ display: 'flex', gap: '6px' }}>
            {FILTER_TYPES.filter(t => t !== 'todos').map(t => (
              <Button
                key={t}
                id={`contacts-filter-${t}`}
                variant="ghost"
                size="sm"
                onClick={() => setFilterType(filterType === t ? 'todos' : t)}
                style={filterType === t
                  ? { borderColor: 'var(--ember-border)', color: 'var(--ember)', background: 'var(--ember-dim)' }
                  : {}
                }
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>
          <Button id="contacts-btn-new" variant="primary" size="sm" onClick={() => openDrawer(null)}>
            + Nueva empresa
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div id="contacts-stats" className={styles.stats}>
        {[
          { label: 'Total empresas', value: stats.total,        sub: 'registradas',    id: 'stat-total' },
          { label: 'Clientes',       value: stats.clientes,     sub: 'activos',        id: 'stat-clientes' },
          { label: 'Prospectos',     value: stats.prospectos,   sub: 'en seguimiento', id: 'stat-prospectos' },
          { label: 'Con contactos',  value: stats.conContactos, sub: 'con personas',   id: 'stat-con-contactos' },
        ].map(s => (
          <Card.Stat
            key={s.id}
            id={s.id}
            label={s.label}
            value={loading ? '—' : s.value}
            sub={s.sub}
          />
        ))}
      </div>

      {/* Table */}
      <Card
        id="contacts-table"
        style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        {/* Header */}
        <div
          id="contacts-table-header"
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 80px 1.5fr 100px 48px',
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          {['EMPRESA', 'TIPO', 'CONTACTOS', 'MAIL', 'ACTUALIZADO', ''].map(col => (
            <div key={col} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {col}
            </div>
          ))}
        </div>

        {/* Body */}
        <div id="contacts-table-body" style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div id="contacts-loading" style={{ padding: '3rem', textAlign: 'center', color: 'var(--stone)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em' }}>
              CARGANDO...
            </div>
          ) : filtered.length === 0 ? (
            <div id="contacts-empty" style={{ padding: '3rem', textAlign: 'center', color: 'var(--stone)', fontFamily: 'var(--font-sans)', fontSize: '14px' }}>
              {search || filterType !== 'todos'
                ? 'Sin resultados para la búsqueda.'
                : 'Todavía no hay empresas.'}
            </div>
          ) : filtered.map(company => (
            <div
              key={company.id}
              id={`company-row-${company.id}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 80px 1.5fr 100px 48px',
                padding: '12px 16px',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {/* Empresa */}
              <div id={`company-col-name-${company.id}`} style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--off-white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {company.name}
                </div>
                {company.website && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {company.website}
                  </div>
                )}
              </div>

              {/* Tipo */}
              <div id={`company-col-type-${company.id}`}>
                {company.type && (
                  <Badge variant={company.type} size="sm">{company.type}</Badge>
                )}
              </div>

              {/* Contactos count */}
              <div id={`company-col-contacts-${company.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--stone)', textAlign: 'center' }}>
                {company.contacts?.length ?? 0}
              </div>

              {/* Mail */}
              <div id={`company-col-mail-${company.id}`} style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--stone)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                {company.email || '—'}
              </div>

              {/* Actualizado */}
              <div id={`company-col-date-${company.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)' }}>
                {relativeDate(company.updated_at)}
              </div>

              {/* Abrir */}
              <Button
                id={`company-btn-open-${company.id}`}
                variant="ghost"
                size="sm"
                onClick={() => openDrawer(company)}
                style={{ padding: '0.3rem 0.7rem', fontSize: '13px' }}
              >
                →
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <CompanyDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        company={drawerOpen && selectedCompanyId === null ? null : selectedCompany}
        onCreate={createCompany}
        onUpdate={updateCompany}
        onDelete={deleteCompany}
        onAddContact={createContact}
        onDeleteContact={deleteContact}
      />
    </div>
  )
}
