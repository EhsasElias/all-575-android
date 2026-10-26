import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { StatusChip } from '../components/StatusChip';
import { formatDateTime } from '../format/dateTime';
import { SUBORDER_STATUS_LOOK } from '../status/statusLook';
import type { Suborder } from '../types';
import { DeliveryCode } from './DeliveryCode';
import { localized } from './localized';
import { SuborderItems } from './SuborderItems';
import { SuborderProgress } from './SuborderProgress';
import styles from './SuborderCard.module.css';

type SuborderCardProps = {
  orderId: string;
  suborder: Suborder;
};

const OPEN_STATUSES: readonly Suborder['status'][] = [
  'awaiting_seller',
  'preparing',
  'ready',
  'on_the_way',
];

function Eta({ suborder }: { suborder: Suborder }) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const { at, reason } = suborder.eta;
  if (!OPEN_STATUSES.includes(suborder.status)) return null;

  return (
    <div className={styles.eta}>
      <p className={styles.etaLine}>
        <Icon name="clock" size={20} />
        {at === null
          ? t('suborder.etaPending')
          : t('suborder.eta', { time: formatDateTime(at, language) })}
      </p>
      {reason !== null && <p className={styles.reason}>{t('suborder.etaRevised', { reason })}</p>}
    </div>
  );
}

/** One seller's part of the order: it is packed, shipped and delivered on its own. */
export function SuborderCard({ orderId, suborder }: SuborderCardProps) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const titleId = useId();
  const look = SUBORDER_STATUS_LOOK[suborder.status];

  return (
    <article aria-labelledby={titleId} className={styles.card}>
      <header className={styles.header}>
        <h3 id={titleId} className={styles.seller}>
          {t('suborder.from', { seller: localized(suborder.seller.name, language) ?? '' })}
        </h3>
        <StatusChip icon={look.icon} tone={look.tone}>
          {t(`status.suborder.${suborder.status}`)}
        </StatusChip>
      </header>
      {suborder.status !== 'cancelled' && suborder.status !== 'awaiting_payment' && (
        <SuborderProgress status={suborder.status} />
      )}
      <Eta suborder={suborder} />
      <SuborderItems orderId={orderId} suborder={suborder} />
      {suborder.status === 'on_the_way' && (
        <DeliveryCode orderId={orderId} suborderId={suborder.id} />
      )}
    </article>
  );
}
