import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState } from '@/shared/ui';

export function HomeScreen() {
  const { t } = useTranslation('catalog');

  return (
    <EmptyState
      headingLevel={1}
      icon="home"
      title={t('home.title')}
      message={t('home.message')}
      action={<ButtonLink to={routePaths.categories}>{t('home.action')}</ButtonLink>}
    />
  );
}
