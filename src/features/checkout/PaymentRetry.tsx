import { useTranslation } from 'react-i18next';
import { Icon } from '@/shared/ui';
import type { PayMethod, Payment } from './payment';
import { PaymentCountdown } from './PaymentCountdown';
import { RetryPaymentForm } from './RetryPaymentForm';
import styles from './PaymentStatus.module.css';

type PaymentRetryProps = {
  payment: Payment;
  holdEndsAtMs: number;
  retrying: boolean;
  retryError: unknown;
  onRetry: (method: PayMethod) => void;
};

/** The attempt failed or timed out, but the items are still held: pay again, with any method. */
export function PaymentRetry({
  payment,
  holdEndsAtMs,
  retrying,
  retryError,
  onRetry,
}: PaymentRetryProps) {
  const { t } = useTranslation('checkout');
  const declined = payment.failure_code === 'card_declined';

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>
        {payment.status === 'expired' ? t('payment.expiredTitle') : t('payment.failedTitle')}
      </h1>
      <p role="alert">
        <Icon name="alert-circle" size={20} />{' '}
        {payment.status === 'expired'
          ? t('payment.expiredMessage')
          : declined
            ? t('payment.declinedMessage')
            : t('payment.failedMessage')}
      </p>
      <PaymentCountdown endsAtMs={holdEndsAtMs} />
      <RetryPaymentForm
        failedMethod={payment.method}
        retrying={retrying}
        error={retryError}
        onSubmit={onRetry}
      />
    </div>
  );
}
