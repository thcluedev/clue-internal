import styles from './Input.module.css'

/**
 * Input
 * label      : string
 * hint       : string
 * error      : string    — red border + message below
 * icon       : ReactNode — left icon
 * size       : 'sm' | 'md' | 'lg'
 * style      : CSSProperties — applied to outer wrapper (use for width, flex, etc.)
 * fieldStyle : CSSProperties — applied to the <input> element (padding, font-size, etc.)
 * className  : string    — applied to outer wrapper
 */
export function Input({
  id,
  label,
  hint,
  error,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  onKeyDown,
  disabled,
  size = 'md',
  style,
  fieldStyle,
  className,
}) {
  const fieldCls = [
    styles.field,
    icon  ? styles.hasIcon    : '',
    error ? styles.fieldError : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={`${styles.wrap} ${styles[size]} ${className ?? ''}`} style={style}>
      {label && (
        <label htmlFor={id} className={styles.label}>{label}</label>
      )}
      <div className={styles.shell}>
        {icon && <span className={styles.iconLeft}>{icon}</span>}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          className={fieldCls}
          style={fieldStyle}
        />
      </div>
      {error && <span className={styles.error}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}
