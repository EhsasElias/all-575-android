import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState } from '@/shared/ui';

export function SignInScreen() {
  const { t } = useTranslation('auth');
  const { t: tCommon } = useTranslation('common');

  return (
    <EmptyState
      headingLevel={1}
      icon="user"
      title={t('unavailableTitle')}
      message={t('unavailableMessage')}
      action={<ButtonLink to={routePaths.home}>{tCommon('actions.continueShopping')}</ButtonLink>}
    />
  );
}
