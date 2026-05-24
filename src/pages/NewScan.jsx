import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

const CHECKS = [
  { icon: '🔒', label: 'Security Headers', sub: 'CSP, HSTS, X-Frame' },
  { icon: '🔐', label: 'SSL / TLS', sub: 'Certificate, Protocol' },
  { icon: '📂', label: 'Info Disclosure', sub: '.env, config, git' },
  { icon: '🗂️', label: 'Exposed Paths', sub: 'Admin, backup files' },
  { icon: '⚠️', label: 'XSS Detection', sub: 'Reflected XSS' },
  { icon: '🌐', label: 'CORS Config', sub: 'Misconfiguration' },
]

export default function NewScan() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Robust URL and domain structure validation (B-22)
  const isValidUrl = (str) => {
    try {
      const urlToTest = str.startsWith('http://') || str.startsWith('https://') 
        ? str 
        : 'https://' + str
      const parsed = new URL(urlToTest)
      return parsed.hostname && parsed.hostname.includes('.') && parsed.hostname.length > 3
    } catch {
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const trimmedUrl = url.trim()
    
    // Perform robust client-side URL check
    if (!isValidUrl(trimmedUrl)) {
      setError('Please enter a valid target URL (e.g. example.com or https://example.com).')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/scans', { target_url: trimmedUrl })
      navigate(`/scan/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start scan. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo">
          🔍 Bug<span className="accent">Finder</span> AI
        </div>
        <div className="nav-right">
          <Link to="/" className="btn btn-ghost btn-sm" id="back-to-dashboard">
            ← Dashboard
          </Link>
        </div>
      </nav>

      <div className="page-wrapper-sm">
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>New Security Scan</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 36 }}>
          Enter the target URL to begin vulnerability assessment
        </p>

        <div className="card">
          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Target URL</label>
              <input
                id="target-url"
                type="text"
                className="input-mono"
                placeholder="https://example.com"
                required
                autoFocus
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="alert alert-warn" style={{ marginTop: 18, marginBottom: 0 }}>
              ⚠️ <strong>Important:</strong> Only scan websites you own or have explicit written
              permission to test. Unauthorized scanning is illegal.
            </div>

            <button
              id="start-scan-btn"
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: 20 }}
            >
              {loading ? (
                <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Starting scan...</>
              ) : '🚀 Start Security Scan'}
            </button>
          </form>

          <div className="checks-grid">
            {CHECKS.map(c => (
              <div className="check-item" key={c.label}>
                <span className="check-icon">{c.icon}</span>
                <div>
                  <div className="check-text">{c.label}</div>
                  <div className="check-sub">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
