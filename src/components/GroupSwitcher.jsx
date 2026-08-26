import { useState } from 'react'
import { useGroups } from '../context/GroupContext'
import { useI18n } from '../context/LanguageContext'
import Modal from './Modal'
import { CheckIcon } from './icons'

/**
 * Centered, prominent care-group switcher in the app header. Tapping it opens a
 * large bottom-sheet list of the user's groups — finger-friendly and legible,
 * and it scales past two or three teams.
 */
export default function GroupSwitcher() {
  const { groups, activeGroup, activeGroupId, setActiveGroupId } = useGroups()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  if (groups.length === 0) return null

  // With a single group there's nothing to switch to — show the name, no picker.
  if (groups.length === 1) {
    return <span className="group-pill group-pill-static">{activeGroup?.name}</span>
  }

  return (
    <>
      <button
        type="button"
        className="group-pill"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={t('switcher.aria', { name: activeGroup?.name })}
      >
        <span className="group-pill-name">{activeGroup?.name}</span>
        <span className="group-pill-chevron" aria-hidden="true">▾</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('switcher.title')}>
        <ul className="switcher-list">
          {groups.map((g) => {
            const isActive = g.id === activeGroupId
            return (
              <li key={g.id}>
                <button
                  type="button"
                  className={`switcher-item${isActive ? ' is-active' : ''}`}
                  onClick={() => {
                    setActiveGroupId(g.id)
                    setOpen(false)
                  }}
                >
                  <span className="switcher-item-name">{g.name}</span>
                  {isActive && <CheckIcon width={24} height={24} />}
                </button>
              </li>
            )
          })}
        </ul>
      </Modal>
    </>
  )
}
