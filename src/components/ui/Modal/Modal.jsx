import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.css'

/**
 * Modal — centered overlay, portal-rendered
 * size    : 'sm' | 'md' | 'lg' | 'full'
 * title   : string
 * footer  : ReactNode
 * onClose : fn
 */
export function Modal({ isOpen, onClose, title, size = 'md', footer, children, id }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      id={`${id ?? 'modal'}-overlay`}
      className={styles.overlay}
      onClick={e => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div
        id={id ?? 'modal'}
        className={`${styles.panel} ${styles[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${id ?? 'modal'}-title` : undefined}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className={styles.header}>
            {title && (
              <h2 id={`${id ?? 'modal'}-title`} className={styles.title}>
                {title}
              </h2>
            )}
            <button
              id={`${id ?? 'modal'}-close`}
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        )}

        {/* Body */}
        <div id={`${id ?? 'modal'}-body`} className={styles.body}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div id={`${id ?? 'modal'}-footer`} className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
