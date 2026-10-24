import type { RouteObject } from 'react-router';
import { routePaths, titled } from '@/shared/lib';
import { AccountScreen } from './AccountScreen';

/** The account screen itself handles guests; add routes that need a signed-in customer to `protectedAccountRoutes`. */
export const accountRoutes: RouteObject[] = [
  { path: routePaths.account, element: <AccountScreen />, handle: titled((t) => t('nav.account')) },
];

export const protectedAccountRoutes: RouteObject[] = [];
