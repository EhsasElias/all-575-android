import { useTranslation } from 'react-i18next';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { StatusChip } from '../components/StatusChip';
import { Section } from '../components/Section';
import { formatDateTime } from '../format/dateTime';
import { isRefundReason } from '../status/reasons';
import type { StatusLook } from '../status/statusLook';
import type { OrderPayment, OrderRefund } from '../types';
import styles from './PaymentsSection.module.css';

const PAYMENT_LOOK: Record<OrderPayment['status'], StatusLook> = {
  pending: { icon: 'clock', tone: 'neutral' },
  paid: { icon: 'check-circle', tone: 'success' },
  failed: { icon: 'alert-circle', tone: 'danger' },
  expired: { icon: 'clock', tone: 'neutral' },
};

// Only "succeeded" gets the check mark; a pending refund is still in progress.
const REFUND_LOOK: Record<OrderRefund['status'], StatusLook> = {
  pending: { icon: 'clock', tone: 'neutral' },
  succeeded: { icon: 'check-circle', tone: 'success' },
  failed: { icon: 'alert-circle', tone: 'danger' },
};

function PaymentRow({ payment }: { payment: OrderPayment }) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const look = PAYMENT_LOOK[payment.status];

  return (
    <li className={styles.row}>
      <div className={styles.line}>
        <p className={styles.title}>{t(`status.method.${payment.method}`)}</p>
        <p className={styles.amount}>{formatMoney(payment.amount, language)}</p>
      </div>
      <StatusChip icon={look.icon} tone={look.tone}>
        {t(`status.payment.${payment.status}`)}
      </StatusChip>
      {payment.paid_at !== null && (
        <p className={styles.muted}>
          {t('payments.paidOn', { date: formatDateTime(payment.paid_at, language) })}
        </p>
      )}
    </li>
  );
}

function RefundRow({ refund }: { refund: OrderRefund }) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const look = REFUND_LOOK[refund.status];

  return (
    <li className={styles.row}>
      <div className={styles.line}>
        <p className={styles.title}>
          {isRefundReason(refund.reason)
            ? t(`payments.reason.${refund.reason}`)
            : t('payments.reason.other')}
        </p>
        <p className={styles.amount}>{formatMoney(refund.amount, language)}</p>
      </div>
      <StatusChip icon={look.icon} tone={look.tone}>
        {t(`status.refund.${refund.status}`)}
      </StatusChip>
      <p className={styles.muted}>{t(`payments.refundNote.${refund.status}`)}</p>
      <p className={styles.muted}>
        {t('payments.requestedOn', { date: formatDateTime(refund.requested_at, language) })}
      </p>
      {refund.status === 'succeeded' && refund.completed_at !== null && (
        <p className={styles.muted}>
          {t('payments.refundedOn', { date: formatDateTime(refund.completed_at, language) })}
        </p>
      )}
      {refund.credit_note_number !== null && (
        <p className={styles.muted}>
          {t('payments.creditNote', { number: refund.credit_note_number })}
        </p>
      )}
    </li>
  );
}

export function PaymentsSection({
  payments,
  refunds,
}: {
  payments: OrderPayment[];
  refunds: OrderRefund[];
}) {
  const { t } = useTranslation('orders');

  return (
    <Section title={t('payments.title')}>
      {payments.length > 0 && (
        <ul className={styles.list} aria-label={t('payments.paymentsLabel')}>
          {payments.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} />
          ))}
        </ul>
      )}
      {refunds.length > 0 && (
        <>
          <h3 className={styles.subtitle}>{t('payments.refundsTitle')}</h3>
          <ul className={styles.list}>
            {refunds.map((refund) => (
              <RefundRow key={refund.id} refund={refund} />
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}
