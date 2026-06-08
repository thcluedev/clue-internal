import styles from './Card.module.css'

/**
 * Card
 * variant  : 'default' | 'raised' | 'stat' | 'inset'
 * hoverable: bool — adds lift on hover
 * padding  : CSS string override
 */
export function Card({ children, variant = 'default', hoverable = false, padding, id, style, className }) {
  const cls = [
    styles.card,
    styles[variant] ?? '',
    hoverable ? styles.hoverable : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <div
      id={id}
      className={cls}
      style={{ ...(padding ? { padding } : {}), ...style }}
    >
      {children}
    </div>
  )
}

/** Card.Header */
Card.Header = function CardHeader({ children, id, style }) {
  return <div id={id} className={styles.header} style={style}>{children}</div>
}

/** Card.Title */
Card.Title = function CardTitle({ children, subtitle, id }) {
  return (
    <div id={id}>
      <div className={styles.title}>{children}</div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
  )
}

/** Card.Body */
Card.Body = function CardBody({ children, id, style }) {
  return <div id={id} className={styles.body} style={style}>{children}</div>
}

/** Card.Footer */
Card.Footer = function CardFooter({ children, id, style }) {
  return <div id={id} className={styles.footer} style={style}>{children}</div>
}

/** Card.Stat — convenience for stat cards */
Card.Stat = function CardStat({ label, value, sub, id }) {
  return (
    <Card id={id} variant="stat">
      {label && <div className={styles.statLabel}>{label}</div>}
      <div className={styles.statValue}>{value}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </Card>
  )
}
