import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = [
  { path: '/contactos',    label: 'Contactos',    icon: '👤', badge: null, id: 'nav-contactos',    end: true  },
  { path: '/crm',          label: 'CRM',          icon: '📊', badge: 0,    id: 'nav-crm',          end: true  },
  { path: '/cotizaciones', label: 'Cotizaciones', icon: '📄', badge: null, id: 'nav-cotizaciones', end: false },
  { path: '/proyectos',    label: 'Proyectos',    icon: '🗂️', badge: null, id: 'nav-proyectos',    end: false },
]

export function Sidebar() {
  const { user, signOut } = useAuth()

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'CI'

  return (
    <aside
      id="sidebar"
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(18, 16, 14, 0.70)',
        backdropFilter: 'blur(32px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(32px) saturate(1.6)',
        border: '1px solid rgba(255, 255, 255, 0.20)',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), inset 1px 0 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.18)',
      }}
    >
      <div
        id="sidebar-logo"
        style={{
          padding: '1.25rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.08em',
          color: 'var(--stone)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          userSelect: 'none',
        }}
      >
        CLUE <span style={{ color: 'var(--ember)' }}>INTERNAL</span>
      </div>

      <nav
        id="sidebar-nav"
        style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}
      >
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            id={item.id}
            to={item.path}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0.55rem 0.75rem',
              borderRadius: '10px',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              textDecoration: 'none',
              transition: 'all 0.15s',
              borderLeft: isActive ? '2px solid var(--ember)' : '2px solid transparent',
              background: isActive ? 'var(--ember-dim)' : 'transparent',
              color: isActive ? 'var(--off-white)' : 'var(--muted)',
            })}
          >
            <span style={{ fontSize: '14px' }}>{item.icon}</span>
            <span id={`${item.id}-label`} style={{ flex: 1 }}>{item.label}</span>
            {item.badge !== null && (
              <span
                id={`${item.id}-badge`}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: '100px',
                  padding: '1px 7px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--stone)',
                }}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div id="sidebar-separator" style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 0.75rem' }} />

      <div
        id="sidebar-user"
        style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            id="sidebar-avatar"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '100px',
              background: 'var(--ember-dim)',
              border: '1px solid var(--ember-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ember)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              id="sidebar-email"
              style={{
                fontSize: '12px',
                color: 'var(--off-white)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.email ?? 'Usuario'}
            </div>
            <div id="sidebar-role" style={{ fontSize: '10px', color: 'var(--stone)', fontFamily: 'var(--font-mono)' }}>
              Admin
            </div>
          </div>
        </div>
        <button
          id="sidebar-signout"
          onClick={signOut}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--stone)',
            textAlign: 'left',
            padding: '0.3rem 0',
            transition: 'color 0.15s',
            letterSpacing: '0.05em',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--ember)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--stone)' }}
        >
          SALIR →
        </button>
      </div>
    </aside>
  )
}
