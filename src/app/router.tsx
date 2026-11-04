import { createBrowserRouter, redirect, type RouteObject } from 'react-router';
import { accountRoutes, protectedAccountRoutes } from '@/features/account';
import { aftercareRoutes } from '@/features/aftercare';
import { addressesRoutes } from '@/features/addresses';
import { authRoutes } from '@/features/auth';
import { cartRoutes } from '@/features/cart';
import { catalogRoutes } from '@/features/catalog';
import { checkoutRoutes } from '@/features/checkout';
import { ordersRoutes } from '@/features/orders';
import { testServerRoutes } from '@/features/testserver';
import { LogoIntroScreen, WelcomeScreen, initialWelcomePath } from '@/features/welcome';
import { routePaths, titled } from '@/shared/lib';
import { RequireAuth } from '@/shared/session';
import { NotFoundScreen } from './layout/NotFoundScreen';
import { RootLayout } from './layout/RootLayout';
import { RouteError } from './layout/RouteError';
import { ShellLayout } from './layout/ShellLayout';

// Non-sensitive marker: only the intro state for this browser tab.
const INTRO_SHOWN_KEY = 'all575:introShown';

function showIntroForThisTab(): boolean {
  try {
    if (window.sessionStorage.getItem(INTRO_SHOWN_KEY) === '1') return false;
    window.sessionStorage.setItem(INTRO_SHOWN_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

function redirectFromRoot() {
  return redirect(routePaths.home);
}

/**
 * Each feature owns its routes (see `routes.tsx` in the feature) and this file only assembles them.
 * The welcome screen sits outside ShellLayout, so it never shows the tab bar. Routes under RequireAuth send
 * guests to sign in and bring them back afterwards.
 */
export const appRoutes: RouteObject[] = [
  {
    path: routePaths.root,
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, loader: redirectFromRoot },
      { path: routePaths.welcome, element: <WelcomeScreen />, handle: titled((t) => t('appName')) },
      {
        path: routePaths.logoIntro,
        element: <LogoIntroScreen />,
        handle: titled((t) => t('appName')),
      },
      {
        element: <ShellLayout />,
        children: [
          ...catalogRoutes,
          ...cartRoutes,
          ...accountRoutes,
          ...authRoutes,
          ...testServerRoutes,
          {
            element: <RequireAuth />,
            children: [
              ...aftercareRoutes,
              ...addressesRoutes,
              ...checkoutRoutes,
              ...ordersRoutes,
              ...protectedAccountRoutes,
            ],
          },
          { path: '*', element: <NotFoundScreen /> },
        ],
      },
    ],
  },
];

export function createAppRouter() {
  // Display the logo only at the start of this tab, never on ordinary page reload.
  // The native app has a separate app-visibility intro handler.
  if (showIntroForThisTab()) {
    const launchPath = initialWelcomePath(window.location) ?? routePaths.logoIntro;
    window.history.replaceState(window.history.state, '', launchPath);
  }
  return createBrowserRouter(appRoutes);
}
