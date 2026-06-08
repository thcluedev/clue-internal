export function GlassBtn({ children, onClick, disabled, variant = 'ghost', size = 'md', style, id }) {
  const base = {
    borderRadius: 'var(--radius-pill)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    border: 'none',
    fontFamily: 'inherit',
    fontWeight: 500,
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  }

  const sizes = {
    sm: { padding: '0.4rem 0.9rem', fontSize: '12px' },
    md: { padding: '0.65rem 1.25rem', fontSize: '13px' },
  }

  const variants = {
    ghost: {
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: 'var(--stone)',
    },
    ember: {
      background: 'var(--ember)',
      border: '1px solid var(--ember-border)',
      color: '#fff',
    },
    pill: {
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: 'var(--stone)',
    },
  }

  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={e => {
        if (!disabled) e.currentTarget.style.filter = 'brightness(1.15)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.filter = 'brightness(1)'
      }}
    >
      {children}
    </button>
  )
}
