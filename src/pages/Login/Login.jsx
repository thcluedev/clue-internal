import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Glass } from '../../components/Glass/Glass'
import { GlassInput } from '../../components/Glass/GlassInput'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSignIn = async () => {
    if (!email || !password) return
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSignIn()
  }

  return (
    <div
      id="login-page"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <Glass id="login-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem' }}>

        <div
          id="login-logo"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.2em',
            color: 'var(--stone)',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          CLUE <span style={{ color: 'var(--ember)' }}>INTERNAL</span>
        </div>

        <h1
          id="login-title"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '20px',
            fontWeight: 500,
            color: 'var(--off-white)',
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          Iniciar sesión
        </h1>

        <div id="login-inputs" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <GlassInput
            id="login-input-email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <GlassInput
            id="login-input-password"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {error && (
          <div
            id="login-error"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--ember)',
              marginBottom: '1rem',
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <div
          id="login-submit"
          onClick={!loading ? handleSignIn : undefined}
          style={{
            background: 'var(--ember)',
            borderRadius: 'var(--radius-pill)',
            padding: '0.75rem',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            textAlign: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            transition: 'all 0.2s',
            userSelect: 'none',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(1.1)' }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </div>

      </Glass>
    </div>
  )
}
