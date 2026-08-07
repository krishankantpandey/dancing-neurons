import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { loginRequest } from '../api/auth.js'
import { useAuthStore } from '../store/authStore.js'
import ErrorBanner from '../components/ErrorBanner.jsx'
import './AuthPage.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token, user } = await loginRequest(email, password)
      login(token, user)
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">🧠 Memory Vault</div>
        <p className="auth-card__subtitle">Log in to your memory bank</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <ErrorBanner message={error} />

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="auth-card__footer">
          No account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  )
}
