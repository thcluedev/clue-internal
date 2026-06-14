import { useProfiles } from '../../../hooks/useProfiles'
import { Select } from '../Select/Select'

export function UserSelect({ value, onChange, label, placeholder = 'Sin asignar', id, ...props }) {
  const { profiles, loading } = useProfiles()

  const options = [
    { value: null, label: placeholder },
    ...profiles.map(p => ({ value: p.id, label: p.full_name })),
  ]

  return (
    <Select
      id={id}
      label={label}
      value={value || null}
      onChange={onChange}
      options={loading ? [{ value: null, label: 'Cargando...' }] : options}
      {...props}
    />
  )
}
