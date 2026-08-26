import { useEffect, useState } from 'react'
import Modal from './Modal'
import SelectSheet from './SelectSheet'
import DateField from './DateField'
import TimeField from './TimeField'
import Stepper from './Stepper'
import { createEvents, createTask } from '../lib/api'
import { addDays, startOfDay, toDateOnly } from '../lib/date'
import { useI18n } from '../context/LanguageContext'
import { friendlyError } from '../lib/errors'

const MAX_WEEKS = 20

function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <div className="setting-row">
      <div>
        <div style={{ fontWeight: 700 }}>{label}</div>
        {hint && (
          <div className="muted" style={{ fontSize: '0.95rem' }}>
            {hint}
          </div>
        )}
      </div>
      <button
        type="button"
        className={`toggle${checked ? ' is-on' : ''}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-knob" />
      </button>
    </div>
  )
}

function atTime(day, hour, minute) {
  const d = new Date(day)
  d.setHours(hour, minute, 0, 0)
  return d
}

/**
 * Add either an event or a task to a specific day. A segmented toggle switches
 * between the two; both share the day picker.
 */
export default function AddModal({
  open,
  onClose,
  groupId,
  userId,
  eventTypes,
  members,
  memberCount,
  defaultDate,
  taskDueDefault,
  defaultMode = 'event',
  onCreated,
}) {
  const { t } = useI18n()
  const [mode, setMode] = useState(defaultMode)
  const [date, setDate] = useState(() => startOfDay(defaultDate || new Date()))
  // Task due date is optional and defaults per entry point (day vs Tasks tab).
  const [taskDue, setTaskDue] = useState(() =>
    taskDueDefault ? startOfDay(taskDueDefault) : null
  )

  // Event fields
  const [title, setTitle] = useState('')
  const [typeId, setTypeId] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [startH, setStartH] = useState(9)
  const [startM, setStartM] = useState(0)
  const [endH, setEndH] = useState(12)
  const [endM, setEndM] = useState(0)
  const [capacity, setCapacity] = useState(1)
  const [repeats, setRepeats] = useState(false)
  const [weeks, setWeeks] = useState(4)

  // Task fields
  const [taskTitle, setTaskTitle] = useState('')
  const [assignee, setAssignee] = useState('')

  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setMode(defaultMode)
      setDate(startOfDay(defaultDate || new Date()))
      setTaskDue(taskDueDefault ? startOfDay(taskDueDefault) : null)
      setError('')
    }
  }, [open, defaultDate, taskDueDefault, defaultMode])

  useEffect(() => {
    if (eventTypes?.length && !typeId) setTypeId(eventTypes[0].id)
  }, [eventTypes, typeId])

  const maxAttendees = Math.max(1, memberCount || 1)

  async function submitEvent() {
    if (!typeId) {
      setError(t('add.chooseType.err'))
      return
    }
    const baseStart = allDay ? atTime(date, 0, 0) : atTime(date, startH, startM)
    const baseEnd = allDay ? atTime(date, 23, 59) : atTime(date, endH, endM)
    if (!allDay && baseEnd <= baseStart) {
      setError(t('add.endAfterStart'))
      return
    }
    const cap = Math.max(1, Math.min(maxAttendees, capacity))
    const count = repeats ? Math.max(1, Math.min(MAX_WEEKS, weeks)) : 1
    const seriesId = count > 1 ? crypto.randomUUID() : null
    const cleanTitle = title.trim() || null

    const rows = []
    for (let i = 0; i < count; i += 1) {
      rows.push({
        group_id: groupId,
        created_by: userId,
        event_type_id: typeId,
        title: cleanTitle,
        all_day: allDay,
        capacity: cap,
        series_id: seriesId,
        start_time: addDays(baseStart, i * 7).toISOString(),
        end_time: addDays(baseEnd, i * 7).toISOString(),
      })
    }
    const { error: err } = await createEvents(rows)
    if (err) throw err
    setTitle('')
    setRepeats(false)
  }

  async function submitTask() {
    const title_ = taskTitle.trim()
    if (!title_) {
      setError(t('add.whatToDo.err'))
      return
    }
    const { error: err } = await createTask({
      group_id: groupId,
      created_by: userId,
      title: title_,
      assigned_user_id: assignee || null,
      is_shared: !assignee,
      due_date: taskDue ? toDateOnly(taskDue) : null,
    })
    if (err) throw err
    setTaskTitle('')
    setAssignee('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'event') await submitEvent()
      else await submitTask()
      onCreated?.()
      onClose()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const typeOptions = (eventTypes || []).map((ty) => ({ value: ty.id, label: ty.name }))
  const memberOptions = [
    { value: '', label: t('picker.anyoneShared') },
    ...(members || []).map((m) => ({
      value: m.userId,
      label: m.userId === userId ? t('common.me') : m.name,
      initials: m.initials,
    })),
  ]

  return (
    <Modal open={open} onClose={onClose} title={t('add.title')}>
      <form onSubmit={handleSubmit} className="stack">
        <div className="segmented" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'event'}
            className={`segmented-btn${mode === 'event' ? ' is-active' : ''}`}
            onClick={() => {
              setMode('event')
              setError('')
            }}
          >
            {t('add.event')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'task'}
            className={`segmented-btn${mode === 'task' ? ' is-active' : ''}`}
            onClick={() => {
              setMode('task')
              setError('')
            }}
          >
            {t('add.task')}
          </button>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {mode === 'event' ? (
          <>
            <div className="field" style={{ marginBottom: 0 }}>
              <span className="field-label">{t('add.day')}</span>
              <DateField value={date} onChange={setDate} />
            </div>

            <label className="field" style={{ marginBottom: 0 }}>
              <span className="field-label">{t('add.titleOptional')}</span>
              <input
                className="input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('add.titlePlaceholder')}
              />
            </label>

            <div className="field" style={{ marginBottom: 0 }}>
              <span className="field-label">{t('add.type')}</span>
              <SelectSheet
                title={t('add.chooseType')}
                value={typeId}
                onChange={setTypeId}
                options={typeOptions}
                placeholder={t('add.chooseType')}
              />
            </div>

            <ToggleRow label={t('add.allDay')} checked={allDay} onChange={setAllDay} />

            {!allDay && (
              <div className="time-row">
                <div className="field" style={{ marginBottom: 0, flex: 1 }}>
                  <span className="field-label">{t('add.starts')}</span>
                  <TimeField
                    hour={startH}
                    minute={startM}
                    onChange={(h, m) => {
                      setStartH(h)
                      setStartM(m)
                    }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0, flex: 1 }}>
                  <span className="field-label">{t('add.ends')}</span>
                  <TimeField
                    hour={endH}
                    minute={endM}
                    onChange={(h, m) => {
                      setEndH(h)
                      setEndM(m)
                    }}
                  />
                </div>
              </div>
            )}

            <div className="field" style={{ marginBottom: 0 }}>
              <span className="field-label">{t('add.howMany')}</span>
              <Stepper value={capacity} min={1} max={maxAttendees} onChange={setCapacity} />
              <span className="field-hint">{t('add.upTo', { n: maxAttendees })}</span>
            </div>

            <ToggleRow label={t('add.repeat')} checked={repeats} onChange={setRepeats} />

            {repeats && (
              <div className="field" style={{ marginBottom: 0 }}>
                <span className="field-label">{t('add.howManyWeeks')}</span>
                <Stepper value={weeks} min={1} max={MAX_WEEKS} onChange={setWeeks} suffix={t('add.weeks')} />
                <span className="field-hint">{t('add.eachWeekSeparate')}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <label className="field" style={{ marginBottom: 0 }}>
              <span className="field-label">{t('add.whatToDo')}</span>
              <input
                className="input"
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder={t('add.taskPlaceholder')}
              />
            </label>

            <div className="field" style={{ marginBottom: 0 }}>
              <span className="field-label">{t('add.whoFor')}</span>
              <SelectSheet
                title={t('add.whoFor')}
                hasAvatars
                value={assignee}
                onChange={setAssignee}
                options={memberOptions}
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <span className="field-label">{t('add.dueOptional')}</span>
              <DateField
                value={taskDue}
                onChange={setTaskDue}
                clearable
                placeholder={t('add.noDueDate')}
              />
            </div>
          </>
        )}

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
          {busy ? t('common.saving') : mode === 'event' ? t('add.addEvent') : t('add.addTask')}
        </button>
      </form>
    </Modal>
  )
}
