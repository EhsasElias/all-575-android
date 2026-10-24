import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { Facts, Fact } from '../components/Facts';
import { OrderStatusChip } from '../components/OrderStatusChip';
import { formatDateTime } from '../format/dateTime';
import { isCancelReason } from '../status/reasons';
import type { OrderDetail } from '../types';
import { OrderActions } from './OrderActions';
import { summarizeRefunds } from './refundSummary';
import styles from './OrderHeader.module.css';

type OrderHeaderProps = {
  order: OrderDetail;
  /** Changes when focus should move to the title, e.g. after the customer cancelled. */
  focusRequest: number;
  onCancelled: () => void;
};

function CancellationNotice({ order }: { order: OrderDetail }) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const reason = order.cancel_reason;

  return (
    <p className={styles.notice}>
      {isCancelReason(reason) ? t(`detail.cancelReason.${reason}`) : t('detail.cancelReason.other')}
      {order.cancelled_at !== null &&
        ` ${t('detail.cancelledOn', { date: formatDateTime(order.cancelled_at, language) })}`}
    </p>
  );
}

function RefundDate({ order }: { order: OrderDetail }) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const summary = summarizeRefunds(order.refunds);
  if (summary === null) return null;

  const date = formatDateTime(summary.at, language);
  const text = {
    done: date,
    pending: t('detail.refundPending', { date }),
    failed: t('detail.refundFailed', { date }),
  }[summary.kind];

  return <Fact label={t('detail.refundDate')}>{text}</Fact>;
}

/** The order number and status, the three dates kept apart, and the actions that apply right now. */
export function OrderHeader({ order, focusRequest, onCancelled }: OrderHeaderProps) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusRequest > 0) titleRef.current?.focus();
  }, [focusRequest]);

  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <h1 ref={titleRef} tabIndex={-1} className={styles.title}>
          {t('detail.title', { number: order.number })}
        </h1>
        <OrderStatusChip status={order.status} />
      </div>
      <Facts>
        <Fact label={t('detail.orderDate')}>{formatDateTime(order.placed_at, language)}</Fact>
        <Fact label={t('detail.paymentDate')}>
          {order.paid_at === null ? t('detail.notPaid') : formatDateTime(order.paid_at, language)}
        </Fact>
        <RefundDate order={order} />
      </Facts>
      {order.status === 'cancelled' && <CancellationNotice order={order} />}
      <OrderActions order={order} onCancelled={onCancelled} />
    </header>
  );
}
