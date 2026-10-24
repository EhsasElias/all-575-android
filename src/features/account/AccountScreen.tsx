import { useTranslation } from 'react-i18next';
import { useSession } from '@/shared/session';
import { Skeleton } from '@/shared/ui';
import { GuestAccount } from './components/GuestAccount';
import { SignedInAccount } from './components/SignedInAccount';

/** One screen for everyone: a guest is invited to sign in, a signed-in customer manages the account. */
export function AccountScreen() {
  const { t } = useTranslation('account');
  const { status, user } = useSession();

  if (status === 'signed-in' && user !== null) return <SignedInAccount user={user} />;
  if (status === 'guest') return <GuestAccount />;

  return (
    <div role="status" aria-busy="true" aria-label={t('loading')}>
      <Skeleton height="2rem" width="50%" />
    </div>
  );
}
