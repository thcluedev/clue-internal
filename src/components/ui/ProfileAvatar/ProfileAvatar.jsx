import { useProfiles } from '../../../hooks/useProfiles'

const SIZES = {
  xs: { width: 22, height: 22, fontSize: 8  },
  sm: { width: 28, height: 28, fontSize: 10 },
  md: { width: 36, height: 36, fontSize: 13 },
  lg: { width: 44, height: 44, fontSize: 16 },
}

export function ProfileAvatar({ userId, size = 'sm', showName = false }) {
  const { getInitials, getColor, getName } = useProfiles()

  if (!userId) return null

  const s     = SIZES[size] || SIZES.sm
  const color = getColor(userId)

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width:           s.width,
        height:          s.height,
        borderRadius:    '100px',
        background:      `${color}28`,
        border:          `1px solid ${color}66`,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        fontFamily:      'var(--font-mono)',
        fontSize:        s.fontSize,
        color:           color,
        flexShrink:      0,
        userSelect:      'none',
      }}>
        {getInitials(userId)}
      </div>
      {showName && (
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize:   '13px',
          color:      'var(--off-white)',
        }}>
          {getName(userId)}
        </span>
      )}
    </div>
  )
}
