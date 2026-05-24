import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api'

const CATEGORIES = {
  security_headers: '🔒 Security Headers',
  ssl_tls: '🔐 SSL / TLS',
  info_disclosure: '📂 Information Disclosure',
  exposed_paths: '🗂 Exposed Paths',
  xss: '⚠️ XSS',
  cors: '🌐 CORS',
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function VulnSection({ catKey, catName, vulns = [] }) {
  const [open, setOpen] = useState(true)

  // Filter out any internally captured scanner exceptions/errors from showing as vulnerabilities (B-12)
  const realVulns = vulns.filter(bug => bug.title && bug.title !== 'Scan Error' && bug.severity !== 'INFO' && !bug.error)

  return (
    <div className="vuln-section">
      <div className="vuln-section-head" onClick={() => setOpen(!open)}>
        <h4>{catName}</h4>
        <span className="vuln-section-count">
          {realVulns.length} issue{realVulns.length !== 1 ? 's' : ''} {open ? '▲' : '▼'}
        </span>
      </div>
      {open && (
        <div>
          {realVulns.length > 0 ? (
            realVulns.map((bug, i) => (
              <div className="bug-item" key={i}>
                <div className="bug-top">
                  <span className="bug-title">{bug.title}</span>
                  <span className={`badge badge-${bug.severity || 'INFO'}`}>
                    {bug.severity || 'INFO'}
                  </span>
                </div>
                <p className="bug-desc">{bug.description}</p>
                <div className="bug-fix">✅ Fix: {bug.fix}</div>
              </div>
            ))
          ) : (
            <div className="no-issues">✅ No issues found in this category</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ScanDetail() {
  const { id } = useParams()
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  const fetchScan = async () => {
    try {
      const res = await api.get(`/scans/${id}`)
      setScan(res.data)
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load scan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScan()
  }, [id])

  // Poll while running
  useEffect(() => {
    if (!scan || scan.status === 'done' || scan.status === 'error') return
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/scans/${id}/status`)
        if (res.data.status === 'done' || res.data.status === 'error') {
          clearInterval(interval)
          fetchScan() // reload full data
        }
      } catch (e) {
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [scan?.status])

  // Programmatic, secure PDF download using Axios blob fetch (B-05)
  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await api.get(`/scans/${scan.id}/download`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      
      // Resolve safe local filename
      const rawName = scan.target_url.replace('https://','').replace('http://','').slice(0, 30)
      const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '')
      link.setAttribute('download', `BugReport_${safeName || 'Scan'}_${scan.id}.pdf`)
      
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Failed to download PDF report:', e)
      alert('Failed to download PDF report file. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <>
        <nav className="navbar">
          <div className="nav-logo">🔍 Bug<span className="accent">Finder</span> AI</div>
          <div className="nav-right">
            <Link to="/" className="btn btn-ghost btn-sm">← Dashboard</Link>
          </div>
        </nav>
        <div className="loading-page"><div className="spinner" /><span>Loading scan...</span></div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <nav className="navbar">
          <div className="nav-logo">🔍 Bug<span className="accent">Finder</span> AI</div>
          <div className="nav-right"><Link to="/" className="btn btn-ghost btn-sm">← Dashboard</Link></div>
        </nav>
        <div className="page-wrapper">
          <div className="alert alert-error">⚠️ {error}</div>
        </div>
      </>
    )
  }

  const results = scan.results || {}
  const vulnerabilities = results.vulnerabilities || {}

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo">🔍 Bug<span className="accent">Finder</span> AI</div>
        <div className="nav-right">
          <Link to="/" className="btn btn-ghost btn-sm" id="back-btn">← Dashboard</Link>
        </div>
      </nav>

      <div className="page-wrapper" style={{ maxWidth: 900 }}>
        <div className="page-head">
          <div>
            <h2>Scan #{scan.id}</h2>
            <div className="url-tag">{scan.target_url}</div>
          </div>
          {scan.pdf_ready && (
            <button
              onClick={handleDownload}
              className="btn btn-primary"
              id="download-pdf-btn"
              disabled={downloading}
            >
              {downloading ? 'Downloading...' : '⬇ Download PDF Report'}
            </button>
          )}
        </div>

        {/* Running state */}
        {(scan.status === 'running' || scan.status === 'pending') && (
          <div className="scan-running">
            <div className="spinner" />
            <p>🔍 Scanning <strong>{scan.target_url}</strong>...</p>
            <p className="sub">Checking headers, SSL, exposed paths, XSS, CORS...</p>
          </div>
        )}

        {/* Error state */}
        {scan.status === 'error' && (
          <div className="alert alert-error">
            ⚠️ Scan failed: {results.error || 'Unknown error'}
          </div>
        )}

        {/* Done state */}
        {scan.status === 'done' && (
          <>
            <div className="meta-grid">
              <div className="meta-card">
                <div className={`val risk-${scan.risk_score}`}>{scan.risk_score}</div>
                <div className="lbl">Risk Score</div>
              </div>
              <div className="meta-card">
                <div className="val" style={{ color: 'var(--danger)' }}>{scan.bugs_found}</div>
                <div className="lbl">Total Bugs</div>
              </div>
              <div className="meta-card">
                <div className="val" style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
                  {formatDate(scan.created_at)}
                </div>
                <div className="lbl">Scan Date</div>
              </div>
              <div className="meta-card">
                <div className="val" style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
                  DONE
                </div>
                <div className="lbl">Status</div>
              </div>
            </div>

            {Object.entries(CATEGORIES).map(([key, name]) => (
              <VulnSection
                key={key}
                catKey={key}
                catName={name}
                vulns={vulnerabilities[key] || []}
              />
            ))}
          </>
        )}
      </div>
    </>
  )
}
