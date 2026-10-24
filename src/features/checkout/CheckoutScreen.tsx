import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState } from '@/shared/ui';

export function CheckoutScreen() {
  const { t } = useTranslation('checkout');

  return (
    <EmptyState
      headingLevel={1}
      icon="cart"
      title={t('emptyTitle')}
      message={t('emptyMessage')}
      action={<ButtonLink to={routePaths.cart}>{t('action')}</ButtonLink>}
    />
  );
}
