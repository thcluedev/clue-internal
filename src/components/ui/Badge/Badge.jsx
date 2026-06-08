import styles from './Badge.module.css'

/**
 * Badge
 * variant : 'default' | 'ember' | 'success' | 'warning' | 'error' | 'glass'
 *           | 'cliente' | 'prospecto' | 'proveedor' | 'otro'
 * size    : 'sm' | 'md' | 'lg'
 * dot     : bool — shows status dot
 */
export function Badge({ children, variant = 'default', size = 'md', dot = false, id, style, className }) {
  const cls = [
    styles.badge,
    styles[variant] ?? styles.default,
    styles[size],
    dot ? styles.dot : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <span id={id} className={cls} style={style}>
      {children}
    </span>
  )
}
