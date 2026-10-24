import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { errorCode } from '@/shared/api';
import { Button, Icon } from '@/shared/ui';
import { PAY_METHODS, type PayMethod, type Payment } from './payment';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import styles from './RetryPaymentForm.module.css';

type RetryPaymentFormProps = {
  /** The method of the attempt that did not work: it is not the one pre-selected again. */
  failedMethod: Payment['method'];
  retrying: boolean;
  error: unknown;
  onSubmit: (method: PayMethod) => void;
};

const KNOWN_REFUSALS = ['payments_unavailable', 'payment_provider_error'] as const;

function refusalOf(error: unknown): (typeof KNOWN_REFUSALS)[number] | 'failed' | null {
  if (error === null) return null;
  const code = errorCode(error);
  return KNOWN_REFUSALS.find((known) => known === code) ?? 'failed';
}

/** Pick a method and start a new payment attempt for the same order. */
export function RetryPaymentForm({
  failedMethod,
  retrying,
  error,
  onSubmit,
}: RetryPaymentFormProps) {
  const { t } = useTranslation('checkout');
  const [method, setMethod] = useState<PayMethod>(
    () => PAY_METHODS.find((candidate) => candidate !== failedMethod) ?? 'mada',
  );
  const refusal = refusalOf(error);

  return (
    <div className={styles.form}>
      <PaymentMethodPicker
        value={method}
        onChange={setMethod}
        headingLevel="h2"
        label={t('payment.chooseMethod')}
      />
      {refusal && (
        <p className={styles.error} role="alert">
          <Icon name="alert-circle" size={20} />
          {t(`payment.retryErrors.${refusal}`)}
        </p>
      )}
      <Button
        size="lg"
        fullWidth
        loading={retrying}
        onClick={() => {
          onSubmit(method);
        }}
      >
        {t('payment.tryWith', { method: t(`method.options.${method}.name`) })}
      </Button>
    </div>
  );
}
