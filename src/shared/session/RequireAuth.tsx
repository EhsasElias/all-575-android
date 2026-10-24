import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router';
import { routePaths } from '@/shared/lib';
import { Skeleton } from '@/shared/ui';
import { useSession } from './sessionContext';

/** A layout route: its children are reachable only when signed in; guests are sent to sign in and brought back. */
export function RequireAuth() {
  const { status } = useSession();
  const location = useLocation();
  const { t } = useTranslation();

  if (status === 'loading') {
    return (
      <div role="status" aria-busy="true" aria-label={t('states.loading')}>
        <Skeleton height="2rem" />
      </div>
    );
  }

  if (status === 'guest') {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`${routePaths.signIn}?next=${next}`} replace />;
  }

  return <Outlet />;
}
