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

export function WhatsAppIcon(props) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.33 4.95L2 22l5.3-1.38a9.86 9.86 0 0 0 4.74 1.2h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0 0 12.04 2Zm0 1.8c2.16 0 4.19.84 5.72 2.37a8.05 8.05 0 0 1 2.37 5.73c0 4.46-3.63 8.09-8.1 8.09a8.1 8.1 0 0 1-4.12-1.13l-.3-.17-3.06.8.82-2.98-.2-.31a8.03 8.03 0 0 1-1.24-4.3c0-4.46 3.63-8.09 8.1-8.09Zm-4.5 4.3c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63s1.13 3.05 1.29 3.26c.16.21 2.22 3.39 5.38 4.75.75.32 1.34.51 1.8.66.75.24 1.44.2 1.98.12.6-.09 1.86-.76 2.12-1.5.26-.73.26-1.36.18-1.49-.08-.13-.29-.21-.6-.37-.31-.16-1.86-.92-2.15-1.02-.29-.11-.5-.16-.71.16-.21.31-.81 1.02-1 1.23-.18.21-.37.24-.68.08-.31-.16-1.32-.49-2.52-1.55-.93-.83-1.56-1.86-1.74-2.17-.18-.31-.02-.48.14-.63.14-.14.31-.37.47-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.7-1.72-.98-2.35-.24-.55-.49-.5-.68-.5l-.58-.01Z" />
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
