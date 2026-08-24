import { Link } from 'react-router-dom'
import { SunIcon } from '../components/icons'

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="container auth-inner">
        <div className="auth-brand">
          <SunIcon width={44} height={44} />
          <span>Tornasol</span>
        </div>
        <div className="card stack center">
          <h1>Page not found</h1>
          <p className="muted">That page doesn't seem to exist.</p>
          <Link to="/app" className="btn btn-primary btn-block">
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
