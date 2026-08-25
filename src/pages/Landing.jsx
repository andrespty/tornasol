import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'
import { SunIcon } from '../components/icons'

export default function Landing() {
  const { isAuthenticated, loading } = useAuth()

  // Returning, logged-in users go straight to the app.
  if (loading) return <Loading label="Opening Tornasol…" />
  if (isAuthenticated) return <Navigate to="/app" replace />

  return (
    <div className="landing">
      <div className="container landing-inner">
        <div className="landing-mark">
          <SunIcon width={64} height={64} />
        </div>

        <h1 className="landing-title">Tornasol</h1>

        <p className="landing-lead">
          Caring for someone you love is easier when everyone shares the load.
        </p>

        <div className="card landing-card stack">
          <p>
            Tornasol helps your family take turns caring for a parent, partner,
            or friend. See who is on today, sign up for an event when you can, and leave
            a note for whoever comes next.
          </p>
          <p className="muted">
            Simple, warm, and easy to read — made for real families.
          </p>
        </div>

        <Link to="/auth" className="btn btn-primary btn-block btn-lg landing-cta">
          Get started
        </Link>

        <p className="muted center landing-signin">
          Already have an account? <Link to="/auth">Log in</Link>
        </p>
      </div>
    </div>
  )
}
