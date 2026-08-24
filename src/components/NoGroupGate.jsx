import CreateGroupCard from './CreateGroupCard'
import { SunIcon } from './icons'

/**
 * Shown in place of any /app screen when the user belongs to no care groups.
 * Nothing in the app works without a group, so we funnel everyone straight to
 * creating (or being invited to) one.
 */
export default function NoGroupGate() {
  return (
    <div className="page stack-3">
      <div className="center stack">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SunIcon width={56} height={56} />
        </div>
        <h1 style={{ marginBottom: 0 }}>Let's set up your care team</h1>
        <p className="muted" style={{ marginBottom: 0 }}>
          Everything in Tornasol happens inside a care team. Create one to get
          started — or open an invite link someone shared with you.
        </p>
      </div>
      <CreateGroupCard />
    </div>
  )
}
