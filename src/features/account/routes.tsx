import type { RouteObject } from 'react-router';
import { routePaths, titled } from '@/shared/lib';
import { AccountScreen } from './AccountScreen';
import { LegalScreen } from './LegalScreen';
import { ProfileScreen } from './ProfileScreen';
import { SessionsScreen } from './SessionsScreen';

/** The account screen itself handles guests, and the legal texts are public. */
export const accountRoutes: RouteObject[] = [
  { path: routePaths.account, element: <AccountScreen />, handle: titled((t) => t('nav.account')) },
  {
    path: routePaths.terms,
    element: <LegalScreen document="terms" />,
    handle: titled((t) => t('legal.terms.title', { ns: 'account' })),
  },
  {
    path: routePaths.privacy,
    element: <LegalScreen document="privacy" />,
    handle: titled((t) => t('legal.privacy.title', { ns: 'account' })),
  },
];

/** Routes that need a signed-in customer: the router wraps them in RequireAuth. */
export const protectedAccountRoutes: RouteObject[] = [
  {
    path: routePaths.profile,
    element: <ProfileScreen />,
    handle: titled((t) => t('profile.title', { ns: 'account' })),
  },
  {
    path: routePaths.sessions,
    element: <SessionsScreen />,
    handle: titled((t) => t('sessions.title', { ns: 'account' })),
  },
];
