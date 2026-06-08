import styles from './Button.module.css'

/**
 * Button
 * variant : 'primary' | 'ghost' | 'danger' | 'icon'
 * size    : 'sm' | 'md' | 'lg'
 * loading : bool
 * fullWidth: bool
 */
export function Button({
  children,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  id,
  style,
  className,
}) {
  const cls = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth  ? styles.fullWidth : '',
    loading    ? styles.loading   : '',
    className  ?? '',
  ].filter(Boolean).join(' ')

  return (
    <button
      id={id}
      type={type}
      className={cls}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  )
}
