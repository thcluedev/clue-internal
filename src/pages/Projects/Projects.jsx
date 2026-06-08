import { Glass } from '../../components/Glass/Glass'

export default function Projects() {
  return (
    <Glass style={{ padding: '2.5rem', flex: 1 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--ember)', marginBottom: '1rem' }}>
        04 — PROYECTOS
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: 500, color: 'var(--off-white)', marginBottom: '0.5rem' }}>
        Próximamente
      </h2>
      <p style={{ color: 'var(--stone)', fontSize: '13px' }}>
        Este módulo se construye en el siguiente paso.
      </p>
    </Glass>
  )
}
