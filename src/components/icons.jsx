/* Simple, legible line icons drawn inline (no icon library needed). */

const base = {
  width: 26,
  height: 26,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
}

export function HomeIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  )
}

export function CalendarIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  )
}

export function TasksIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6.5h11M4 12h11M4 17.5h7" />
      <path d="m18 5.5 1.6 1.6L22 4.6" />
    </svg>
  )
}

export function NotesIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  )
}

export function PeopleIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <path d="M16 5.2A3 3 0 0 1 16 11M17.5 14.6c2 .6 3.5 2.5 3.5 5" />
    </svg>
  )
}

export function SunIcon(props) {
  // A stylized sunflower/sun — Tornasol's mark.
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="12" cy="12" r="4" fill="var(--color-primary)" />
      <g stroke="var(--color-accent-light)" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        <path d="M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
      </g>
    </svg>
  )
}

export function PlusIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function CheckIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12.5 4.5 4.5L19 6.5" />
    </svg>
  )
}

export function TrashIcon(props) {
  return (
    <svg {...base} {...props} width={22} height={22}>
      <path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13" />
    </svg>
  )
}

export function CopyIcon(props) {
  return (
    <svg {...base} {...props} width={22} height={22}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </svg>
  )
}
