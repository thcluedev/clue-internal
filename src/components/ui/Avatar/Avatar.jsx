import styles from './Avatar.module.css'

function getInitials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

/**
 * Avatar
 * name    : string  — used for initials fallback
 * src     : string  — image URL
 * size    : 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * variant : 'default' | 'ember'
 * status  : 'online' | 'away' | 'busy' | 'offline'
 */
export function Avatar({ name, src, size = 'md', variant = 'default', status, id, style, className }) {
  const cls = [
    styles.avatar,
    styles[size],
    variant === 'ember' ? styles.ember : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <div id={id} className={cls} style={style} title={name}>
      {src
        ? <img src={src} alt={name ?? ''} className={styles.img} />
        : getInitials(name)
      }
      {status && (
        <span
          id={id ? `${id}-status` : undefined}
          className={`${styles.status} ${styles[status]}`}
        />
      )}
    </div>
  )
}

/**
 * Avatar.Group — stacked avatars with +N overflow
 * max    : number — how many to show before "+N"
 */
Avatar.Group = function AvatarGroup({ avatars = [], max = 4, size = 'md', id }) {
  const visible  = avatars.slice(0, max)
  const overflow = avatars.length - max

  return (
    <div id={id} className={styles.group}>
      {visible.map((av, i) => (
        <Avatar key={av.id ?? i} {...av} size={size} />
      ))}
      {overflow > 0 && (
        <div id={id ? `${id}-overflow` : undefined} className={styles.overflow}>
          +{overflow}
        </div>
      )}
    </div>
  )
}
