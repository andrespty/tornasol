import { useCallback, useEffect, useState } from 'react'
import {
  fetchEventTypes,
  createEventType,
  updateEventType,
  deleteEventType,
} from '../lib/api'
import { EVENT_COLORS } from '../lib/eventColors'
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
    if (
      !window.confirm(
        `Delete the "${type.name}" type? Events using it will keep their color but lose the label.`
      )
    )
      return
    const { error: err } = await deleteEventType(type.id)
    if (err) setError(friendlyError(err))
    else load()
  }

  // The color currently shown in the open picker.
  const editingColor =
    colorEditing === 'new'
      ? newColor
      : types.find((t) => t.id === colorEditing)?.color

  function applyColor(color) {
    if (colorEditing === 'new') setNewColor(color)
    else if (colorEditing) recolor(colorEditing, color)
  }

  return (
    <section className="card stack">
      <h2 style={{ marginBottom: 0 }}>Event types</h2>
      <p className="muted" style={{ margin: 0 }}>
        Categories for your events. Tap the color to change it.
      </p>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <InlineLoading />
      ) : (
        <ul className="type-list">
          {types.map((t) => (
            <li key={t.id} className="type-item">
              <ColorDot
                color={t.color}
                label={`Change color for ${t.name}`}
                onClick={() => setColorEditing(t.id)}
              />
              <input
                className="input type-name-input"
                defaultValue={t.name}
                aria-label="Type name"
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v && v !== t.name) rename(t, v)
                }}
              />
              <button className="icon-btn" aria-label={`Delete ${t.name}`} onClick={() => remove(t)}>
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="type-add">
        <span className="field-label" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
          Add a type
        </span>
        <div className="type-item type-add-row">
          <ColorDot
            color={newColor}
            label="Choose color for new type"
            onClick={() => setColorEditing('new')}
          />
          <input
            className="input type-name-input"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Meal time"
          />
          <button
            className="btn btn-secondary btn-sm"
            disabled={busy || !newName.trim()}
            aria-label="Add type"
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
