import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { formatMoney, formatNumber, useLanguage } from '@/shared/i18n';
import { routeTo } from '@/shared/lib';
import { ButtonLink } from '@/shared/ui';
import { OrderStatusChip } from '../components/OrderStatusChip';
import { formatDate } from '../format/dateTime';
import type { OrderSummary } from '../types';
import styles from './OrderCard.module.css';

const MAX_THUMBNAILS = 3;

function PaymentPrompt({ order }: { order: OrderSummary }) {
  const { t } = useTranslation('orders');
  const failed = order.payment_status === 'failed' || order.payment_status === 'expired';

  return (
    <div className={styles.payment}>
      <p className={styles.paymentText}>
        {failed ? t('list.paymentFailed') : t('list.paymentWaiting')}
      </p>
      <ButtonLink to={routeTo.checkoutPayment(order.id)}>{t('list.completePayment')}</ButtonLink>
    </div>
  );
}

/** The whole card opens the order; the payment button stays a separate target on top of it. */
export function OrderCard({ order }: { order: OrderSummary }) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();

  return (
    <li className={styles.card}>
      <div className={styles.top}>
        <h2 className={styles.number}>
          <Link to={routeTo.order(order.id)} className={styles.link}>
            {t('list.orderNumber', { number: order.number })}
          </Link>
        </h2>
        <OrderStatusChip status={order.status} />
      </div>
      <dl className={styles.facts}>
        <div>
          <dt className={styles.label}>{t('list.placed')}</dt>
          <dd className={styles.value}>{formatDate(order.placed_at, language)}</dd>
        </div>
        <div>
          <dt className={styles.label}>{t('list.items')}</dt>
          <dd className={styles.value}>{formatNumber(order.items_count, language)}</dd>
        </div>
        <div>
          <dt className={styles.label}>{t('list.total')}</dt>
          <dd className={styles.value}>{formatMoney(order.total, language)}</dd>
        </div>
      </dl>
      {order.preview_images.length > 0 && (
        <ul className={styles.thumbs} aria-hidden="true">
          {order.preview_images.slice(0, MAX_THUMBNAILS).map((src) => (
            <li key={src}>
              <img src={src} alt="" loading="lazy" className={styles.thumb} />
            </li>
          ))}
        </ul>
      )}
      {order.status === 'pending_payment' && <PaymentPrompt order={order} />}
    </li>
  );
}
