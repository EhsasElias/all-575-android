import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState } from '@/shared/ui';

export function CartScreen() {
  const { t } = useTranslation('cart');
  const { t: tCommon } = useTranslation('common');

  return (
    <EmptyState
      headingLevel={1}
      icon="cart"
      title={t('emptyTitle')}
      message={t('emptyMessage')}
      action={<ButtonLink to={routePaths.home}>{tCommon('actions.startShopping')}</ButtonLink>}
    />
  );
}
