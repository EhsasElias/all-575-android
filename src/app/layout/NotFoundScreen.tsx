import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState } from '@/shared/ui';

export function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <EmptyState
      headingLevel={1}
      icon="info"
      title={t('notFound.title')}
      message={t('notFound.message')}
      action={<ButtonLink to={routePaths.home}>{t('actions.backToHome')}</ButtonLink>}
    />
  );
}
