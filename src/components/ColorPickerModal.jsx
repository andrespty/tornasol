import Modal from './Modal'
import { useI18n } from '../context/LanguageContext'
import { EVENT_COLORS } from '../lib/eventColors'

/** A modal grid of color swatches. Picking one calls onPick and closes. */
export default function ColorPickerModal({ open, value, onPick, onClose }) {
  const { t } = useI18n()
  return (
    <Modal open={open} onClose={onClose} title={t('picker.pickColor')}>
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
