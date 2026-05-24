import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
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
          <p>Create your free account</p>
        </div>

        <div className="auth-card">
          <h2>Create account</h2>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                id="reg-username"
                type="text"
                placeholder="Choose a username"
                required
                autoFocus
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                id="reg-email"
                type="email"
                placeholder="your@email.com"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                id="reg-password"
                type="password"
                placeholder="Min. 6 characters"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button
              id="reg-submit"
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>

          <div className="auth-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
