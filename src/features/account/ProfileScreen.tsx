import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { useSession } from '@/shared/session';
import { Skeleton } from '@/shared/ui';
import { BackLink } from './components/BackLink';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
import { ProfileForm } from './components/ProfileForm';
import { SignInDetails } from './components/SignInDetails';

/** Edit what the API lets a customer change about themselves. The route is already behind RequireAuth. */
export function ProfileScreen() {
  const { t } = useTranslation('account');
  const { user } = useSession();

  return (
    <Page>
      <PageHeader
        title={t('profile.title')}
        back={<BackLink to={routePaths.account} label={t('backToAccount')} />}
      />
      {user === null ? (
        <div role="status" aria-busy="true" aria-label={t('loading')}>
          <Skeleton height="3rem" />
        </div>
      ) : (
        <>
          {/* Keyed by the customer: a different account never starts from someone else's edits. */}
          <ProfileForm key={user.id} user={user} />
          <SignInDetails user={user} />
        </>
      )}
    </Page>
  );
}
