import { useCallback, useEffect, useState } from 'react'
import {
  fetchEventTypes,
  createEventType,
  updateEventType,
  deleteEventType,
} from '../lib/api'
import { EVENT_COLORS } from '../lib/eventColors'
import { useI18n } from '../context/LanguageContext'
import { friendlyError } from '../lib/errors'
import { InlineLoading } from './Loading'
import ColorPickerModal from './ColorPickerModal'
import { TrashIcon, PlusIcon } from './icons'

function ColorDot({ color, onClick, label }) {
  return (
    <button
      type="button"
      className="color-dot"
      style={{ backgroundColor: color }}
      onClick={onClick}
      aria-label={label}
    />
  )
}

export default function EventTypesManager({ groupId }) {
  const { t } = useI18n()
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(EVENT_COLORS[0].value)
  const [busy, setBusy] = useState(false)
  // Which color picker is open: a type id, or 'new', or null.
  const [colorEditing, setColorEditing] = useState(null)

  const load = useCallback(async () => {
    const { data } = await fetchEventTypes(groupId)
    setTypes(data || [])
    setLoading(false)
  }, [groupId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  async function handleAdd(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setBusy(true)
    setError('')
    try {
      const { error: err } = await createEventType(groupId, {
        name,
        color: newColor,
        sortOrder: (types[types.length - 1]?.sort_order || 0) + 1,
      })
      if (err) throw err
      setNewName('')
      setNewColor(EVENT_COLORS[0].value)
      await load()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function recolor(typeId, color) {
    setTypes((prev) => prev.map((t) => (t.id === typeId ? { ...t, color } : t)))
    await updateEventType(typeId, { color })
  }

  async function rename(type, name) {
    await updateEventType(type.id, { name })
  }

  async function remove(type) {
    if (!window.confirm(t('types.confirmDelete', { name: type.name }))) return
    const { error: err } = await deleteEventType(type.id)
    if (err) setError(friendlyError(err))
    else load()
  }

  // The color currently shown in the open picker.
  const editingColor =
    colorEditing === 'new'
      ? newColor
      : types.find((ty) => ty.id === colorEditing)?.color

  function applyColor(color) {
    if (colorEditing === 'new') setNewColor(color)
    else if (colorEditing) recolor(colorEditing, color)
  }

  return (
    <section className="card stack">
      <h2 style={{ marginBottom: 0 }}>{t('types.title')}</h2>
      <p className="muted" style={{ margin: 0 }}>{t('types.intro')}</p>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <InlineLoading label={t('common.loading')} />
      ) : (
        <ul className="type-list">
          {types.map((ty) => (
            <li key={ty.id} className="type-item">
              <ColorDot
                color={ty.color}
                label={ty.name}
                onClick={() => setColorEditing(ty.id)}
              />
              <input
                className="input type-name-input"
                defaultValue={ty.name}
                aria-label={t('types.name')}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v && v !== ty.name) rename(ty, v)
                }}
              />
              <button className="icon-btn" aria-label={t('common.add')} onClick={() => remove(ty)}>
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="type-add">
        <span className="field-label" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
          {t('types.addLabel')}
        </span>
        <div className="type-item type-add-row">
          <ColorDot
            color={newColor}
            label={t('picker.pickColor')}
            onClick={() => setColorEditing('new')}
          />
          <input
            className="input type-name-input"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('types.addPlaceholder')}
          />
          <button
            className="btn btn-secondary btn-sm"
            disabled={busy || !newName.trim()}
            aria-label={t('types.addLabel')}
          >
            <PlusIcon width={20} height={20} />
          </button>
        </div>
      </form>

      <ColorPickerModal
        open={colorEditing !== null}
        value={editingColor}
        onPick={applyColor}
        onClose={() => setColorEditing(null)}
      />
    </section>
  )
}
