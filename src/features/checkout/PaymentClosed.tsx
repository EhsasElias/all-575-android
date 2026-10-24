import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState } from '@/shared/ui';

/** The time to pay is over: the items went back on the shelf. Nothing was charged. */
export function PaymentClosed() {
  const { t } = useTranslation('checkout');

  return (
    <EmptyState
      headingLevel={1}
      icon="clock"
      tone="error"
      title={t('payment.closedTitle')}
      message={t('payment.closedMessage')}
      action={
        <>
          <ButtonLink to={routePaths.cart}>{t('payment.backToCart')}</ButtonLink>{' '}
          <ButtonLink to={routePaths.orders} variant="secondary">
            {t('payment.myOrders')}
          </ButtonLink>
        </>
      }
    />
  );
}
