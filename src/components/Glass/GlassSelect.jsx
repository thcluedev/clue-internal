import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export function GlassSelect({ value, onChange, options, id, style }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef(null)

  const selected = options.find(o => o.value === value)

  const handleToggle = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width })
    }
    setOpen(o => !o)
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const dropdown = open && createPortal(
    <div style={{
      position: 'fixed',
      top: pos.top,
      left: pos.left,
      width: pos.width,
      background: 'rgba(16, 14, 12, 0.96)',
      backdropFilter: 'blur(28px) saturate(1.5)',
      WebkitBackdropFilter: 'blur(28px) saturate(1.5)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      overflow: 'hidden',
      zIndex: 9999,
      boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
    }}>
      {options.map((option, i) => {
        const isSelected = option.value === value
        return (
          <div
            key={option.value}
            onMouseDown={e => e.preventDefault()}
            onClick={() => { onChange(option.value); setOpen(false) }}
            style={{
              padding: '0.65rem 1.1rem',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              color: isSelected ? 'var(--off-white)' : 'var(--stone)',
              background: isSelected ? 'rgba(232,76,30,0.12)' : 'transparent',
              cursor: 'pointer',
              transition: 'background 0.12s, color 0.12s',
              borderBottom: i < options.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = isSelected ? 'rgba(232,76,30,0.2)' : 'rgba(255,255,255,0.07)'
              e.currentTarget.style.color = 'var(--off-white)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = isSelected ? 'rgba(232,76,30,0.12)' : 'transparent'
              e.currentTarget.style.color = isSelected ? 'var(--off-white)' : 'var(--stone)'
            }}
          >
            {option.label}
            {isSelected && (
              <span style={{ color: 'var(--ember)', fontSize: '11px', flexShrink: 0 }}>✓</span>
            )}
          </div>
        )
      })}
    </div>,
    document.body
  )

  return (
    <div ref={triggerRef} id={id} style={{ position: 'relative', ...style }}>
      {/* Trigger */}
      <div
        onClick={handleToggle}
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: `1px solid ${open ? 'var(--ember-border)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 'var(--radius-pill)',
          padding: '0.6rem 2.5rem 0.6rem 1.1rem',
          color: 'var(--off-white)',
          fontSize: '14px',
          cursor: 'pointer',
          userSelect: 'none',
          fontFamily: 'inherit',
          transition: 'border-color 0.2s',
          position: 'relative',
        }}
      >
        {selected?.label ?? '—'}
        <span style={{
          position: 'absolute',
          right: '1rem',
          top: '50%',
          transform: `translateY(-50%) rotate(${open ? '180deg' : '0deg'})`,
          color: 'var(--stone)',
          fontSize: '10px',
          transition: 'transform 0.2s',
          pointerEvents: 'none',
        }}>
          ▾
        </span>
      </div>

      {dropdown}
    </div>
  )
}
