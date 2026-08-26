import { useState } from 'react'
import { createGroup } from '../lib/api'
import { useGroups } from '../context/GroupContext'
import { useI18n } from '../context/LanguageContext'
import { friendlyError } from '../lib/errors'

export default function CreateGroupCard({ onCreated }) {
  const { refreshGroups, setActiveGroupId } = useGroups()
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { data, error: err } = await createGroup(name.trim())
      if (err) throw err
      // The group is saved; if reading it back fails (usually a row-level
      // security issue), show that rather than silently doing nothing.
      const { error: refreshErr } = await refreshGroups()
      if (refreshErr) throw refreshErr
      if (data?.id) setActiveGroupId(data.id)
      setName('')
      onCreated?.(data)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card stack">
      <h2 style={{ marginBottom: 0 }}>{t('createGroup.title')}</h2>
      <p className="muted">{t('createGroup.intro')}</p>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      <label className="field" style={{ marginBottom: 0 }}>
        <span className="field-label">{t('createGroup.nameLabel')}</span>
        <input
          className="input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('createGroup.namePlaceholder')}
          required
        />
      </label>
      <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
        {busy ? t('createGroup.creating') : t('createGroup.submit')}
      </button>
    </form>
  )
}
