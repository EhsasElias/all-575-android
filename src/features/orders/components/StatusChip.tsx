import type { ReactNode } from 'react';
import { cx } from '@/shared/lib';
import { Icon, type IconName } from '@/shared/ui';
import type { StatusTone } from '../status/statusLook';
import styles from './StatusChip.module.css';

type StatusChipProps = {
  icon: IconName;
  tone: StatusTone;
  children: ReactNode;
};

/** A status as an icon and words together. */
export function StatusChip({ icon, tone, children }: StatusChipProps) {
  return (
    <span className={cx(styles.chip, styles[tone])}>
      <Icon name={icon} size={18} className={styles.icon} />
      {children}
    </span>
  );
}
