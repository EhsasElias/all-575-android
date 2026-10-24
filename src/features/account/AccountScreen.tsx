import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState } from '@/shared/ui';

export function AccountScreen() {
  const { t } = useTranslation('account');

  return (
    <EmptyState
      headingLevel={1}
      icon="user"
      title={t('guestTitle')}
      message={t('guestMessage')}
      action={<ButtonLink to={routePaths.signIn}>{t('signIn')}</ButtonLink>}
    />
  );
}
