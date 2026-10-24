import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState } from '@/shared/ui';

export function CategoriesScreen() {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation('common');

  return (
    <EmptyState
      headingLevel={1}
      icon="grid"
      title={t('categories.title')}
      message={t('categories.message')}
      action={<ButtonLink to={routePaths.home}>{tCommon('actions.backToHome')}</ButtonLink>}
    />
  );
}
