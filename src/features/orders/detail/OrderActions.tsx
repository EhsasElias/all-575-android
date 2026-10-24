import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { routeTo } from '@/shared/lib';
import { ButtonLink } from '@/shared/ui';
import { formatDateTime } from '../format/dateTime';
import { isActiveOrder } from '../status/statusLook';
import type { OrderDetail } from '../types';
import { CancelOrder } from './CancelOrder';
import styles from './OrderActions.module.css';

function PayNow({ order }: { order: OrderDetail }) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const holdUntil = order.payments.find((payment) => payment.status === 'pending')?.expires_at;

  return (
    <div className={styles.pay}>
      <p className={styles.payText}>
        {holdUntil === undefined
          ? t('detail.payWaiting')
          : t('detail.payHold', { time: formatDateTime(holdUntil, language) })}
      </p>
      <ButtonLink to={routeTo.checkoutPayment(order.id)}>{t('list.completePayment')}</ButtonLink>
    </div>
  );
}

/** What the customer can do right now: pay, cancel, or why cancelling is no longer possible. */
export function OrderActions({
  order,
  onCancelled,
}: {
  order: OrderDetail;
  onCancelled: () => void;
}) {
  const { t } = useTranslation('orders');

  if (!isActiveOrder(order.status)) return null;

  return (
    <div className={styles.actions}>
      {order.status === 'pending_payment' && <PayNow order={order} />}
      <CancelOrder order={order} onCancelled={onCancelled} />
      {!order.can_cancel && order.status === 'confirmed' && (
        <p className={styles.locked}>{t('cancel.locked')}</p>
      )}
    </div>
  );
}
