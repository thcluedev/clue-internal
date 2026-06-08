export function Glass({ children, className, style, variant = 'default', id }) {
  const base = {
    background: variant === 'light'
      ? 'rgba(255, 255, 255, 0.18)'
      : 'rgba(22, 20, 18, 0.62)',
    backdropFilter: 'blur(28px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
    border: variant === 'light'
      ? '1px solid rgba(255, 255, 255, 0.32)'
      : '1px solid rgba(255, 255, 255, 0.22)',
    borderRadius: '18px',
    boxShadow: variant === 'light'
      ? 'inset 0 1px 0 rgba(255,255,255,0.45), 0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)'
      : 'inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 32px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.10)',
  }

  return (
    <div id={id} style={{ ...base, ...style }} className={className}>
      {children}
    </div>
  )
}
