import type { RouteObject } from 'react-router';
import { routePaths, titled } from '@/shared/lib';
import { SignInScreen } from './SignInScreen';

export const authRoutes: RouteObject[] = [
  { path: routePaths.signIn, element: <SignInScreen />, handle: titled((t) => t('nav.signIn')) },
];
