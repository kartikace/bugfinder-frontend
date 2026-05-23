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
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

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
    try {
      await api.delete(`/scans/${id}`)
      setData(prev => ({
        ...prev,
        scans: prev.scans.filter(s => s.id !== id),
        stats: {
          ...prev.stats,
          total: prev.stats.total - 1,
          total_bugs: prev.stats.total_bugs - (prev.scans.find(s => s.id === id)?.bugs_found || 0),
        }
      }))
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  const handleLogout = () => {
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
          <span className="nav-user">Hello, <strong>{user.username}</strong></span>
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
                              <a
                                href={`/api/scans/${scan.id}/download`}
                                className="btn btn-sm"
                                style={{ background: 'rgba(0,212,170,.12)', color: 'var(--accent)', border: '1px solid rgba(0,212,170,.25)' }}
                                id={`dl-scan-${scan.id}`}
                              >
                                PDF
                              </a>
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
