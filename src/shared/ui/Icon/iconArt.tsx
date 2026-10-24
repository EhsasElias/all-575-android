import type { ReactNode } from 'react';
import type { IconName } from './iconNames';

const CIRCLE = <circle cx="12" cy="12" r="9" />;

export const ICONS: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M3.5 11.2 12 4l8.5 7.2" />
      <path d="M5.5 9.8V19a1 1 0 0 0 1 1H10v-5.5h4V20h3.5a1 1 0 0 0 1-1V9.8" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2.3l2.1 10.6h10.2l2.1-7.8H6.1" />
      <circle cx="9.2" cy="19" r="1.4" />
      <circle cx="16.8" cy="19" r="1.4" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3.5h12V21l-3-1.8-3 1.8-3-1.8L6 21z" />
      <path d="M9.2 8.5h5.6M9.2 12.5h5.6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M4.8 20c.4-3.6 3.2-5.6 7.2-5.6s6.8 2 7.2 5.6" />
    </>
  ),
  pause: (
    <>
      <rect x="6.5" y="5" width="3.8" height="14" rx="1.2" fill="currentColor" stroke="none" />
      <rect x="13.7" y="5" width="3.8" height="14" rx="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  play: (
    <path
      d="M8 5.6v12.8a.8.8 0 0 0 1.2.7l10-6.4a.8.8 0 0 0 0-1.4l-10-6.4A.8.8 0 0 0 8 5.6z"
      fill="currentColor"
      stroke="none"
    />
  ),
  'arrow-forward': <path d="M5 12h14M13 6l6 6-6 6" />,
  // Physical chevrons: they point left or right on screen, whatever the language direction.
  'chevron-left': <path d="m14.5 6-6 6 6 6" />,
  'chevron-right': <path d="m9.5 6 6 6-6 6" />,
  sparkle: (
    <path
      d="M12 2.5c.7 5.2 3.3 8.8 9 9.5-5.7.7-8.3 4.3-9 9.5-.7-5.2-3.3-8.8-9-9.5 5.7-.7 8.3-4.3 9-9.5z"
      fill="currentColor"
      stroke="none"
    />
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  'check-circle': (
    <>
      {CIRCLE}
      <path d="m8 12.5 2.8 2.8L16.2 9.6" />
    </>
  ),
  'alert-circle': (
    <>
      {CIRCLE}
      <path d="M12 7.5v5.5M12 16.4v.1" />
    </>
  ),
  info: (
    <>
      {CIRCLE}
      <path d="M12 11v5.5M12 7.6v.1" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V4.8c0-.4.3-.8.8-.8h3.4c.5 0 .8.4.8.8V7" />
      <path d="M6.5 7l.8 12.2c0 .5.5.8 1 .8h7.4c.5 0 1-.3 1-.8L17.5 7" />
      <path d="M10 11v5.5M14 11v5.5" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" />
  ),
  'map-pin': (
    <>
      <path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6.5h11v10H3zM14 10h4l3 3v3.5h-7" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  clock: (
    <>
      {CIRCLE}
      <path d="M12 7v5.2l3.2 1.9" />
    </>
  ),
  star: <path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />,
  'star-filled': (
    <path
      d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"
      fill="currentColor"
    />
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" />
    </>
  ),
  phone: (
    <path d="M6.6 3.5h2.7l1.4 4-1.8 1.4a11 11 0 0 0 5.7 5.7l1.4-1.8 4 1.4v2.7a2 2 0 0 1-2.1 2A15.5 15.5 0 0 1 4.6 5.6a2 2 0 0 1 2-2.1z" />
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7a1 1 0 0 1 .7.3l7.3 7.3a1 1 0 0 1 0 1.4l-7.2 7.2a1 1 0 0 1-1.4 0l-7.4-7.4a1 1 0 0 1-.7-.1z" />
      <circle cx="8" cy="8" r="1.2" />
    </>
  ),
  'credit-card': (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 10h18M7 15h3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 5 6v5.6c0 4.2 2.9 7.4 7 8.9 4.1-1.5 7-4.7 7-8.9V6z" />
      <path d="m9 12 2.2 2.2L15.2 10" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1" />
      <path d="M17.5 3.5v4h-4M6.5 20.5v-4h4" />
    </>
  ),
  download: <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />,
  'log-out': (
    <>
      <path d="M10 4.5H6.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H10" />
      <path d="M14 8l4 4-4 4M18 12H9.5" />
    </>
  ),
  globe: (
    <>
      {CIRCLE}
      <path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
    </>
  ),
  edit: (
    <>
      <path d="m4.5 19.5.8-3.8L16.4 4.6a1.6 1.6 0 0 1 2.3 0l.7.7a1.6 1.6 0 0 1 0 2.3L8.3 18.7z" />
      <path d="m14.5 6.5 3 3" />
    </>
  ),
  'chevron-down': <path d="m6 9.5 6 6 6-6" />,
  'chevron-up': <path d="m6 14.5 6-6 6 6" />,
  package: (
    <>
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8z" />
      <path d="m4 8 8 4.5L20 8M12 12.5v8" />
    </>
  ),
};
