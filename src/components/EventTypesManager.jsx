import { useCallback, useEffect, useState } from 'react'
import {
  fetchEventTypes,
  createEventType,
  updateEventType,
  deleteEventType,
} from '../lib/api'
import { EVENT_COLORS, DEFAULT_EVENT_COLOR } from '../lib/eventColors'
import { friendlyError } from '../lib/errors'
import { InlineLoading } from './Loading'
import { TrashIcon, PlusIcon } from './icons'

function ColorSwatches({ value, onChange }) {
  return (
    <div className="swatch-row" role="radiogroup" aria-label="Color">
      {EVENT_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          className={`swatch${value === c.value ? ' is-selected' : ''}`}
          style={{ backgroundColor: c.value }}
          aria-label={c.name}
          aria-pressed={value === c.value}
          onClick={() => onChange(c.value)}
        />
      ))}
    </div>
  )
}

export default function EventTypesManager({ groupId }) {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(EVENT_COLORS[0].value)
  const [busy, setBusy] = useState(false)

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

  async function recolor(type, color) {
    setTypes((prev) => prev.map((t) => (t.id === type.id ? { ...t, color } : t)))
    await updateEventType(type.id, { color })
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

  return (
    <section className="card stack">
      <h2 style={{ marginBottom: 0 }}>Event types</h2>
      <p className="muted" style={{ margin: 0 }}>
        Categories for your events, each with a color.
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
            <li key={t.id} className="type-item stack">
              <div className="type-item-head">
                <input
                  className="input type-name-input"
                  defaultValue={t.name}
                  aria-label="Type name"
                  onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (v && v !== t.name) rename(t, v)
                  }}
                />
                <button
                  className="icon-btn"
                  aria-label={`Delete ${t.name}`}
                  onClick={() => remove(t)}
                >
                  <TrashIcon />
                </button>
              </div>
              <ColorSwatches value={t.color} onChange={(c) => recolor(t, c)} />
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="stack type-add">
        <label className="field" style={{ marginBottom: 0 }}>
          <span className="field-label">Add a type</span>
          <input
            className="input"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Meal time"
          />
        </label>
        <ColorSwatches value={newColor} onChange={setNewColor} />
        <button className="btn btn-secondary btn-block" disabled={busy || !newName.trim()}>
          <PlusIcon width={20} height={20} /> Add type
        </button>
      </form>
    </section>
  )
}
