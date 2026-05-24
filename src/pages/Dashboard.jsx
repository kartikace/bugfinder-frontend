import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function BugCount({ count }) {
  const color = count > 5 ? 'var(--danger)' : count > 0 ? 'var(--warn)' : 'var(--ok)'
  return (
    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color }}>
      {count}
    </span>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  
  // Safe localStorage parsing wrapped in try-catch (B-18)
  let user = {}
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}')
  } catch (e) {
    console.error('Failed to parse user profile from localStorage:', e)
  }

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('') // local delete error UI state (B-16)
  const [downloadingId, setDownloadingId] = useState(null) // local download loader (N-01)

  const handleDownload = async (id, target_url) => {
    setDownloadingId(id)
    try {
      const res = await api.get(`/scans/${id}/download`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      
      const rawName = target_url.replace('https://','').replace('http://','').slice(0, 30)
      const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '')
      link.setAttribute('download', `BugReport_${safeName || 'Scan'}_${id}.pdf`)
      
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Failed to download PDF report:', e)
      alert('Failed to download PDF report file. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  const fetchScans = async () => {
    try {
      const res = await api.get('/scans')
      setData(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchScans() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this scan?')) return
    setDeletingId(id)
    setError('')
    try {
      await api.delete(`/scans/${id}`)
      setData(prev => {
        const deletedScan = prev.scans.find(s => s.id === id)
        const isDone = deletedScan?.status === 'done'
        
        return {
          ...prev,
          scans: prev.scans.filter(s => s.id !== id),
          stats: {
            ...prev.stats,
            total: prev.stats.total - 1,
            done: isDone ? prev.stats.done - 1 : prev.stats.done, // Correctly update Done Count (B-17)
            total_bugs: prev.stats.total_bugs - (deletedScan?.bugs_found || 0),
          }
        }
      })
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to delete scan. Please try again.')
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  const handleLogout = async () => {
    try {
      // Wipes HTTP-Only session cookies on server (B-13)
      await api.post('/auth/logout')
    } catch (e) {
      console.error('Backend logout failed:', e)
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo">
          🔍 Bug<span className="accent">Finder</span> AI
        </div>
        <div className="nav-right">
          <span className="nav-user">Hello, <strong>{user.username || 'Agent'}</strong></span>
          <Link to="/new-scan" className="btn btn-primary btn-sm" id="new-scan-btn">
            + New Scan
          </Link>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} id="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="page-wrapper">
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Dashboard</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
          Overview of all your security scans
        </p>

        {loading ? (
          <div className="loading-page">
            <div className="spinner" />
            <span>Loading scans...</span>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-val">{data?.stats?.total ?? 0}</div>
                <div className="stat-lbl">Total Scans</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{data?.stats?.done ?? 0}</div>
                <div className="stat-lbl">Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-val" style={{ color: 'var(--danger)' }}>
                  {data?.stats?.total_bugs ?? 0}
                </div>
                <div className="stat-lbl">Bugs Found</div>
              </div>
            </div>

            {/* Scans Table */}
            <div className="section-header">
              <h3>Recent Scans</h3>
            </div>

            {/* Local deletion error block (B-16) */}
            {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠️ {error}</div>}

            <div className="table-wrap">
              {data?.scans?.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Target URL</th>
                      <th>Status</th>
                      <th>Risk</th>
                      <th>Bugs</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.scans.map(scan => (
                      <tr key={scan.id}>
                        <td style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                          {scan.id}
                        </td>
                        <td><div className="url-cell">{scan.target_url}</div></td>
                        <td>
                          <span className={`badge badge-${scan.status}`}>
                            {scan.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {scan.status === 'done' ? (
                            <span className={`badge badge-${scan.risk_score}`}>
                              {scan.risk_score}
                            </span>
                          ) : '—'}
                        </td>
                        <td><BugCount count={scan.bugs_found} /></td>
                        <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                          {formatDate(scan.created_at)}
                        </td>
                        <td>
                          <div className="action-btns">
                            <Link
                              to={`/scan/${scan.id}`}
                              className="btn btn-ghost btn-sm"
                              id={`view-scan-${scan.id}`}
                            >
                              View
                            </Link>
                            {scan.pdf_ready && (
                              <button
                                onClick={() => handleDownload(scan.id, scan.target_url)}
                                className="btn btn-sm"
                                style={{ background: 'rgba(0,212,170,.12)', color: 'var(--accent)', border: '1px solid rgba(0,212,170,.25)' }}
                                id={`dl-scan-${scan.id}`}
                                disabled={downloadingId === scan.id}
                              >
                                {downloadingId === scan.id ? '...' : 'PDF'}
                              </button>
                            )}
                            <button
                              className="btn btn-danger btn-sm"
                              id={`del-scan-${scan.id}`}
                              onClick={() => handleDelete(scan.id)}
                              disabled={deletingId === scan.id}
                            >
                              {deletingId === scan.id ? '...' : 'Del'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="icon">🛡️</div>
                  <p>No scans yet.<br />Start your first security scan!</p>
                  <Link
                    to="/new-scan"
                    className="btn btn-primary"
                    style={{ marginTop: 20, display: 'inline-flex' }}
                  >
                    + New Scan
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
