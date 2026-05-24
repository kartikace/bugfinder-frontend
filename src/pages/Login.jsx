import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-container">
        <div className="auth-logo">
          <span className="icon">🔍</span>
          <h1>Bug<span className="accent">Finder</span> AI</h1>
          <p>Security Vulnerability Scanner</p>
        </div>

        <div className="auth-card">
          <h2>Sign in to your account</h2>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                id="login-username"
                type="text"
                placeholder="Enter username"
                required
                autoFocus
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="Enter password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="auth-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
