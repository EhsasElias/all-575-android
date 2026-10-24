import { useTranslation } from 'react-i18next';
import { cx } from '@/shared/lib';
import { Icon, type IconName } from '@/shared/ui';
import type { Availability } from '../api/types';
import styles from './AvailabilityBadge.module.css';

const BADGES = {
  in_stock: { icon: 'check-circle', label: 'availability.in_stock', tone: 'good' },
  low_stock: { icon: 'alert-circle', label: 'availability.low_stock', tone: 'warn' },
  out_of_stock: { icon: 'close', label: 'availability.out_of_stock', tone: 'bad' },
  unknown: { icon: 'info', label: 'availability.unknown', tone: 'neutral' },
} as const satisfies Record<
  Availability,
  { icon: IconName; label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }
>;

type AvailabilityBadgeProps = {
  availability: Availability;
  className?: string | undefined;
};

/** Says it in words and with an icon, never by color alone. */
export function AvailabilityBadge({ availability, className }: AvailabilityBadgeProps) {
  const { t } = useTranslation('catalog');
  const badge = BADGES[availability];

  return (
    <span className={cx(styles.badge, styles[badge.tone], className)}>
      <Icon name={badge.icon} size={16} />
      {t(badge.label)}
    </span>
  );
}
