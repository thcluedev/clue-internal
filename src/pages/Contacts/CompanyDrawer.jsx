import { useState, useEffect } from 'react'
import { Button, Input, Badge, Select, Textarea, Avatar } from '../../components/ui'
import styles from './Contacts.module.css'

const TYPE_OPTIONS = [
  { value: 'prospecto', label: 'Prospecto' },
  { value: 'cliente',   label: 'Cliente' },
  { value: 'proveedor', label: 'Proveedor' },
  { value: 'otro',      label: 'Otro' },
]

function SectionTitle({ children, id }) {
  return (
    <div
      id={id}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        color: 'var(--stone)',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {children}
    </div>
  )
}

function DataRow({ label, children, id }) {
  return (
    <div
      id={id}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        gap: '1rem',
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)', letterSpacing: '0.08em', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: children ? 'var(--off-white)' : 'var(--stone)', textAlign: 'right', wordBreak: 'break-all' }}>
        {children || '—'}
      </span>
    </div>
  )
}

const EMPTY_FORM    = { name: '', type: 'prospecto', email: '', phone: '', website: '', notes: '' }
const EMPTY_CONTACT = { name: '', role: '', email: '', phone: '', whatsapp: '' }

export function CompanyDrawer({ isOpen, onClose, company, onCreate, onUpdate, onDelete, onAddContact, onDeleteContact }) {
  const isCreate = isOpen && company === null

  const [editing, setEditing]           = useState(false)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [nameError, setNameError]       = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)

  const [addingContact, setAddingContact] = useState(false)
  const [contactForm, setContactForm]     = useState(EMPTY_CONTACT)
  const [savingContact, setSavingContact] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm(company
        ? { name: company.name || '', type: company.type || 'prospecto', email: company.email || '', phone: company.phone || '', website: company.website || '', notes: company.notes || '' }
        : EMPTY_FORM
      )
    }
    setEditing(false)
    setNameError(false)
    setAddingContact(false)
    setContactForm(EMPTY_CONTACT)
  }, [company, isOpen])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSaveCompany = async () => {
    if (!form.name.trim()) { setNameError(true); return }
    setNameError(false)
    setSavingCompany(true)
    if (isCreate) {
      const { error } = await onCreate(form)
      if (!error) onClose()
    } else {
      await onUpdate(company.id, form)
      setEditing(false)
    }
    setSavingCompany(false)
  }

  const handleDeleteCompany = async () => {
    if (!window.confirm(`¿Eliminar la empresa "${company.name}"?\nEsta acción no se puede deshacer.`)) return
    await onDelete(company.id)
    onClose()
  }

  const handleSaveContact = async () => {
    if (!contactForm.name.trim()) return
    setSavingContact(true)
    const { error } = await onAddContact({ ...contactForm, company_id: company.id })
    if (!error) {
      setContactForm(EMPTY_CONTACT)
      setAddingContact(false)
    }
    setSavingContact(false)
  }

  const handleDeleteContact = async (contact) => {
    if (!window.confirm(`¿Eliminar el contacto "${contact.name}"?`)) return
    onDeleteContact(contact.id)
  }

  const cancelEdit = () => {
    setEditing(false)
    setNameError(false)
    if (company) {
      setForm({ name: company.name || '', type: company.type || 'prospecto', email: company.email || '', phone: company.phone || '', website: company.website || '', notes: company.notes || '' })
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        id="drawer-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s',
        }}
      />

      {/* Drawer panel */}
      <div
        id="company-drawer"
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : styles.drawerClosed}`}
      >
        {/* Header */}
        <div
          id="drawer-header"
          style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexShrink: 0 }}
        >
          <div id="drawer-header-info" style={{ flex: 1, minWidth: 0 }}>
            {isCreate ? (
              <h2 id="drawer-title" style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 500, color: 'var(--off-white)' }}>
                Nueva empresa
              </h2>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h2 id="drawer-title" style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 500, color: 'var(--off-white)', wordBreak: 'break-word' }}>
                  {company?.name}
                </h2>
                {company?.type && (
                  <Badge id="drawer-type-badge" variant={company.type} size="sm">
                    {company.type}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div id="drawer-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {!isCreate && !editing && (
              <Button id="drawer-btn-edit" variant="ghost" size="sm" onClick={() => setEditing(true)}>
                Editar
              </Button>
            )}
            <Button
              id="drawer-btn-close"
              variant="icon"
              size="sm"
              onClick={onClose}
              style={{ width: '32px', height: '32px', fontSize: '18px' }}
            >
              ×
            </Button>
          </div>
        </div>

        {/* Body */}
        <div id="drawer-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>

          {/* ── CREATE MODE ── */}
          {isCreate && (
            <>
              <div id="drawer-create-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <Input
                  id="drawer-create-name"
                  placeholder="Nombre de la empresa *"
                  value={form.name}
                  onChange={e => { setField('name', e.target.value); setNameError(false) }}
                  error={nameError ? 'El nombre es requerido' : undefined}
                />
                <Select
                  id="drawer-create-type"
                  value={form.type}
                  onChange={val => setField('type', val)}
                  options={TYPE_OPTIONS}
                />
                <Input id="drawer-create-email"   placeholder="Mail"      type="email" value={form.email}   onChange={e => setField('email', e.target.value)} />
                <Input id="drawer-create-phone"   placeholder="Teléfono"              value={form.phone}   onChange={e => setField('phone', e.target.value)} />
                <Input id="drawer-create-website" placeholder="Website"               value={form.website} onChange={e => setField('website', e.target.value)} />
                <Textarea
                  id="drawer-create-notes"
                  placeholder="Notas..."
                  value={form.notes}
                  onChange={e => setField('notes', e.target.value)}
                  resize={false}
                  minHeight="100px"
                />
              </div>

              <Button
                id="drawer-btn-create"
                variant="primary"
                onClick={handleSaveCompany}
                disabled={savingCompany}
                loading={savingCompany}
                fullWidth
              >
                Crear empresa
              </Button>
            </>
          )}

          {/* ── VIEW / EDIT MODE ── */}
          {!isCreate && company && (
            <>
              {/* Datos generales */}
              <div id="drawer-section-datos" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <SectionTitle id="drawer-section-datos-title">Datos generales</SectionTitle>

                {editing ? (
                  <div id="drawer-edit-fields" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <Input
                      id="drawer-edit-name"
                      placeholder="Nombre *"
                      value={form.name}
                      onChange={e => { setField('name', e.target.value); setNameError(false) }}
                      error={nameError ? 'El nombre es requerido' : undefined}
                    />
                    <Select
                      id="drawer-edit-type"
                      value={form.type}
                      onChange={val => setField('type', val)}
                      options={TYPE_OPTIONS}
                    />
                    <Input id="drawer-edit-email"   placeholder="Mail"      type="email" value={form.email}   onChange={e => setField('email', e.target.value)} />
                    <Input id="drawer-edit-phone"   placeholder="Teléfono"              value={form.phone}   onChange={e => setField('phone', e.target.value)} />
                    <Input id="drawer-edit-website" placeholder="Website"               value={form.website} onChange={e => setField('website', e.target.value)} />
                  </div>
                ) : (
                  <>
                    <DataRow id="drawer-view-mail"    label="MAIL">{form.email}</DataRow>
                    <DataRow id="drawer-view-phone"   label="TELÉFONO">{form.phone}</DataRow>
                    <DataRow id="drawer-view-website" label="WEBSITE">{form.website}</DataRow>
                  </>
                )}
              </div>

              {/* Notas */}
              <div id="drawer-section-notas" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <SectionTitle id="drawer-section-notas-title">Notas e historial</SectionTitle>
                {editing ? (
                  <Textarea
                    id="drawer-edit-notes"
                    placeholder="Notas, historial, observaciones..."
                    value={form.notes}
                    onChange={e => setField('notes', e.target.value)}
                    resize={false}
                    minHeight="100px"
                  />
                ) : (
                  <div
                    id="drawer-notes-display"
                    style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: form.notes ? 'var(--off-white)' : 'var(--stone)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
                  >
                    {form.notes || 'Sin notas.'}
                  </div>
                )}
              </div>

              {/* Acciones de edición */}
              {editing && (
                <div id="drawer-edit-actions" style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    id="drawer-btn-save"
                    variant="primary"
                    onClick={handleSaveCompany}
                    disabled={savingCompany}
                    loading={savingCompany}
                    style={{ flex: 1 }}
                  >
                    Guardar cambios
                  </Button>
                  <Button id="drawer-btn-cancel" variant="ghost" onClick={cancelEdit}>
                    Cancelar
                  </Button>
                </div>
              )}

              {/* Contactos */}
              <div id="drawer-section-contacts" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <SectionTitle id="drawer-section-contacts-title">
                  Contactos — {company.contacts?.length ?? 0}
                </SectionTitle>

                {company.contacts?.length === 0 && !addingContact && (
                  <p id="drawer-contacts-empty" style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--stone)' }}>
                    Sin contactos aún.
                  </p>
                )}

                {company.contacts?.map(contact => (
                  <div
                    key={contact.id}
                    id={`contact-item-${contact.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <Avatar
                      id={`contact-avatar-${contact.id}`}
                      name={contact.name}
                      size="sm"
                    />

                    <div id={`contact-info-${contact.id}`} style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span id={`contact-name-${contact.id}`} style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--off-white)' }}>
                          {contact.name}
                        </span>
                        {contact.role && (
                          <span id={`contact-role-${contact.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)', letterSpacing: '0.05em' }}>
                            {contact.role}
                          </span>
                        )}
                      </div>
                      {contact.email && (
                        <div id={`contact-email-${contact.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div id={`contact-phone-${contact.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)' }}>
                          {contact.phone}
                        </div>
                      )}
                    </div>

                    <Button
                      id={`contact-btn-delete-${contact.id}`}
                      variant="icon"
                      size="sm"
                      onClick={() => handleDeleteContact(contact)}
                    >
                      ×
                    </Button>
                  </div>
                ))}

                {addingContact ? (
                  <div
                    id="drawer-contact-form"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
                  >
                    <Input id="drawer-contact-name"     placeholder="Nombre *"  value={contactForm.name}     onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} />
                    <Input id="drawer-contact-role"     placeholder="Cargo"      value={contactForm.role}     onChange={e => setContactForm(f => ({ ...f, role: e.target.value }))} />
                    <Input id="drawer-contact-email"    placeholder="Mail"       type="email" value={contactForm.email}    onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} />
                    <Input id="drawer-contact-phone"    placeholder="Teléfono"   value={contactForm.phone}    onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} />
                    <Input id="drawer-contact-whatsapp" placeholder="WhatsApp"   value={contactForm.whatsapp} onChange={e => setContactForm(f => ({ ...f, whatsapp: e.target.value }))} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        id="drawer-btn-save-contact"
                        variant="primary"
                        size="sm"
                        onClick={handleSaveContact}
                        disabled={savingContact}
                        loading={savingContact}
                      >
                        Guardar contacto
                      </Button>
                      <Button
                        id="drawer-btn-cancel-contact"
                        variant="ghost"
                        size="sm"
                        onClick={() => { setAddingContact(false); setContactForm(EMPTY_CONTACT) }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    id="drawer-btn-add-contact"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddingContact(true)}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    + Agregar contacto
                  </Button>
                )}
              </div>

              {/* Eliminar empresa */}
              <div id="drawer-delete-zone" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Button
                  id="drawer-btn-delete"
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteCompany}
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
                >
                  ELIMINAR EMPRESA
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
