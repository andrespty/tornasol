/**
 * A large −/value/+ number stepper. Replaces native number inputs with big,
 * finger-friendly buttons.
 */
export default function Stepper({ value, min = 1, max = 99, onChange, suffix }) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))

  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper-btn"
        onClick={dec}
        disabled={value <= min}
        aria-label="Fewer"
      >
        −
      </button>
      <span className="stepper-value" aria-live="polite">
        {value}
        {suffix ? ` ${suffix}` : ''}
      </span>
      <button
        type="button"
        className="stepper-btn"
        onClick={inc}
        disabled={value >= max}
        aria-label="More"
      >
        +
      </button>
    </div>
  )
}
