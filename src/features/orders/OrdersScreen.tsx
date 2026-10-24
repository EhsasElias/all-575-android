import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState } from '@/shared/ui';

export function OrdersScreen() {
  const { t } = useTranslation('orders');
  const { t: tCommon } = useTranslation('common');

  return (
    <EmptyState
      headingLevel={1}
      icon="receipt"
      title={t('emptyTitle')}
      message={t('emptyMessage')}
      action={<ButtonLink to={routePaths.home}>{tCommon('actions.startShopping')}</ButtonLink>}
    />
  );
}
