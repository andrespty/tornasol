import { SunIcon } from './icons'

/**
 * Friendly placeholder shown when Supabase credentials are not yet set.
 * Keeps the app from crashing during initial setup.
 */
export default function SetupNotice() {
  return (
    <div className="auth-page">
      <div className="container auth-inner">
        <div className="auth-brand">
          <SunIcon width={44} height={44} />
          <span>Tornasol</span>
        </div>
        <div className="card stack">
          <h1 style={{ marginBottom: 0 }}>Almost ready</h1>
          <p>
            Tornasol needs to be connected to its database before you can sign
            in.
          </p>
          <div className="alert alert-info">
            Add your Supabase project URL and anon key to a <code>.env</code>{' '}
            file (see <code>.env.example</code>), then restart the app.
          </div>
          <p className="muted">
            This message only appears during setup — your family will never see
            it.
          </p>
        </div>
      </div>
    </div>
  )
}
