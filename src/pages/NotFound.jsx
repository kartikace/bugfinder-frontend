import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="auth-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-container" style={{ textAlign: 'center', maxWidth: 480 }}>
        <div className="auth-logo" style={{ marginBottom: 24 }}>
          <span className="icon" style={{ fontSize: 64, filter: 'drop-shadow(0 0 10px var(--accent))' }}>⚠️</span>
          <h1 style={{ fontSize: 72, fontFamily: 'var(--mono)', letterSpacing: '-2px', color: 'var(--danger)', textShadow: '0 0 15px rgba(255,68,68,0.4)', margin: '12px 0 0 0' }}>
            404
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, marginTop: 4 }}>
            System Error: Page Not Found
          </p>
        </div>

        <div className="auth-card" style={{ background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '36px 24px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-color)', marginBottom: 24 }}>
            The path you are looking for is restricted or does not exist. It may have been relocated or purged from the database.
          </p>

          <Link
            to="/"
            className="btn btn-primary btn-full"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 44, fontWeight: 600 }}
          >
            ← Return to Secure Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
