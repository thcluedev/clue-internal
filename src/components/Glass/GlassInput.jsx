export function GlassInput({ type = 'text', placeholder, value, onChange, onKeyDown, style, id }) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 'var(--radius-pill)',
        padding: '0.6rem 1.1rem',
        color: 'var(--off-white)',
        fontSize: '14px',
        width: '100%',
        outline: 'none',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s',
        ...style,
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--ember-border)' }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
    />
  )
}
