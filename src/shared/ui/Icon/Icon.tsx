import { cx } from '@/shared/lib';
import styles from './Icon.module.css';
import { ICONS } from './iconArt';
import type { IconName } from './iconNames';

export type { IconName };

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
