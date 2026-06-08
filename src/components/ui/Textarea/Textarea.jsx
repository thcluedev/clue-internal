import styles from './Textarea.module.css'

/**
 * Textarea
 * label    : string
 * hint     : string
 * error    : string
 * maxLength: number — shows char count when set
 * resize   : bool   — default true
 */
export function Textarea({
  id,
  label,
  hint,
  error,
  placeholder,
  value,
  onChange,
  disabled,
  maxLength,
  resize = true,
  minHeight,
  style,
  className,
}) {
  const fieldCls = [
    styles.field,
    !resize      ? styles.noResize   : '',
    error        ? styles.fieldError : '',
    className    ?? '',
  ].filter(Boolean).join(' ')

  const over = maxLength && value?.length > maxLength

  return (
    <div className={styles.wrap}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}

      <textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        maxLength={maxLength ?? undefined}
        className={fieldCls}
        style={{ ...(minHeight ? { minHeight } : {}), ...style }}
      />

      <div className={styles.meta}>
        <span>
          {error && <span className={styles.error}>{error}</span>}
          {hint && !error && <span className={styles.hint}>{hint}</span>}
        </span>
        {maxLength && (
          <span className={`${styles.charCount} ${over ? styles.charCountOver : ''}`}>
            {value?.length ?? 0}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}
