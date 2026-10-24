import type { ReactNode } from 'react';
import { cx } from '@/shared/lib';
import styles from './Icon.module.css';

export type IconName =
  | 'home'
  | 'grid'
  | 'cart'
  | 'receipt'
  | 'user'
  | 'pause'
  | 'play'
  | 'arrow-forward'
  | 'chevron-left'
  | 'chevron-right'
  | 'sparkle'
  | 'close'
  | 'check-circle'
  | 'alert-circle'
  | 'info';

const CIRCLE = <circle cx="12" cy="12" r="9" />;

const ICONS: Record<IconName, ReactNode> = {
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
};

// Icons that point along the reading direction flip in right-to-left layouts.
const DIRECTIONAL: ReadonlySet<IconName> = new Set<IconName>(['arrow-forward']);

type IconProps = {
  name: IconName;
  size?: number;
  className?: string | undefined;
};

export function Icon({ name, size = 24, className }: IconProps) {
  return (
    <svg
      className={cx(styles.icon, DIRECTIONAL.has(name) && styles.mirror, className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}
