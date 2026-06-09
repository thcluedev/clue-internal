import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './Select.module.css'

/**
 * Select — custom dropdown, portal-rendered to escape overflow/transform
 * options : [{ value, label }]
 * label   : string
 */
export function Select({ id, label, value, onChange, options, style, className }) {
  const [open, setOpen]  = useState(false)
  const [pos, setPos]    = useState({ top: 0, left: 0, width: 0 })
  const triggerRef       = useRef(null)
  const dropdownRef      = useRef(null)

  const selected = options.find(o => o.value === value)

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width })
    }
    setOpen(o => !o)
  }

  // Close on outside click — must exclude the portal dropdown itself
  useEffect(() => {
    const handler = (e) => {
      const inTrigger  = triggerRef.current?.contains(e.target)
      const inDropdown = dropdownRef.current?.contains(e.target)
      if (!inTrigger && !inDropdown) setOpen(false)
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
    <div
      ref={dropdownRef}
      className={styles.dropdown}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value
        return (
          <div
            key={String(opt.value)}
            id={`${id ?? 'select'}-option-${opt.value}`}
            className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
            onClick={() => { onChange(opt.value); setOpen(false) }}
          >
            {opt.label}
            {isSelected && <span className={styles.check}>✓</span>}
          </div>
        )
      })}
    </div>,
    document.body
  )

  return (
    <div className={`${styles.wrap} ${className ?? ''}`} style={style}>
      {label && <span id={`${id}-label`} className={styles.label}>{label}</span>}
      <div ref={triggerRef}>
        <button
          id={id}
          type="button"
          className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
          onClick={handleToggle}
        >
          {selected?.label ?? '—'}
          <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>▾</span>
        </button>
      </div>
      {dropdown}
    </div>
  )
}
