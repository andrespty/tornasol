import Modal from './Modal'
import { EVENT_COLORS } from '../lib/eventColors'

/** A modal grid of color swatches. Picking one calls onPick and closes. */
export default function ColorPickerModal({ open, value, onPick, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Pick a color">
      <div className="swatch-grid" role="radiogroup" aria-label="Color">
        {EVENT_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            className={`swatch-lg${value === c.value ? ' is-selected' : ''}`}
            style={{ backgroundColor: c.value }}
            aria-label={c.name}
            aria-pressed={value === c.value}
            onClick={() => {
              onPick(c.value)
              onClose()
            }}
          />
        ))}
      </div>
    </Modal>
  )
}
