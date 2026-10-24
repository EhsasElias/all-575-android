import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { Button, Icon } from '@/shared/ui';
import type { PayMethod, Payment } from './payment';
import { PaymentCountdown } from './PaymentCountdown';
import { RetryPaymentForm } from './RetryPaymentForm';
import styles from './PaymentStatus.module.css';

type PaymentPendingProps = {
  orderNumber: string | null;
  payment: Payment;
  holdEndsAtMs: number | null;
  /** The provider's secure page, when the server gave one. */
  redirectUrl: string | null;
  chooserOpen: boolean;
  onToggleChooser: () => void;
  retrying: boolean;
  retryError: unknown;
  onRetry: (method: PayMethod) => void;
  /** The simulate panel of the local fake provider; absent in production. */
  devPanel: ReactNode;
};

/** The payment is started and waiting for the bank. Only the server's confirmation will move the customer on. */
export function PaymentPending({
  orderNumber,
  payment,
  holdEndsAtMs,
  redirectUrl,
  chooserOpen,
  onToggleChooser,
  retrying,
  retryError,
  onRetry,
  devPanel,
}: PaymentPendingProps) {
  const { t } = useTranslation('checkout');
  const { language } = useLanguage();

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>{t('payment.pendingTitle')}</h1>
      <p className={styles.summary}>
        {orderNumber && t('payment.order', { number: orderNumber })}{' '}
        <strong>{formatMoney(payment.amount, language)}</strong>
        {' · '}
        {payment.method !== 'none' && t(`method.options.${payment.method}.name`)}
      </p>

      {holdEndsAtMs !== null && <PaymentCountdown endsAtMs={holdEndsAtMs} />}

      {redirectUrl && (
        <section className={styles.card} aria-labelledby="continue-heading">
          <h2 id="continue-heading" className={styles.heading}>
            {t('payment.continueHeading')}
          </h2>
          <p>{t('payment.continueMessage')}</p>
          <Button
            size="lg"
            fullWidth
            onClick={() => {
              window.open(redirectUrl, '_blank', 'noopener,noreferrer');
            }}
          >
            <Icon name="lock" size={20} />
            {t('payment.continue')}
          </Button>
        </section>
      )}

      <p className={styles.waiting} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        {t('payment.waiting')}
      </p>
      <p className={styles.note}>{t('payment.onlyServerCounts')}</p>

      <Button variant="secondary" onClick={onToggleChooser} aria-expanded={chooserOpen}>
        {t('payment.otherMethod')}
      </Button>
      {chooserOpen && (
        <RetryPaymentForm
          failedMethod={payment.method}
          retrying={retrying}
          error={retryError}
          onSubmit={onRetry}
        />
      )}

      {devPanel}
    </div>
  );
}
