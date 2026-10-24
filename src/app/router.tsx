import { createBrowserRouter, redirect, type RouteObject } from 'react-router';
import { AccountScreen } from '@/features/account';
import { SignInScreen } from '@/features/auth';
import { CartScreen } from '@/features/cart';
import { CategoriesScreen, HomeScreen } from '@/features/catalog';
import { CheckoutScreen } from '@/features/checkout';
import { OrdersScreen } from '@/features/orders';
import { WelcomeScreen, hasSeenWelcome } from '@/features/welcome';
import { routePaths } from '@/shared/lib';
import { titled } from './layout/documentTitle';
import { NotFoundScreen } from './layout/NotFoundScreen';
import { RootLayout } from './layout/RootLayout';
import { RouteError } from './layout/RouteError';
import { ShellLayout } from './layout/ShellLayout';

function redirectFromRoot() {
  return redirect(hasSeenWelcome() ? routePaths.home : routePaths.welcome);
}

// The welcome screen sits outside ShellLayout, so it never shows the tab bar.
export const appRoutes: RouteObject[] = [
  {
    path: routePaths.root,
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, loader: redirectFromRoot },
      { path: routePaths.welcome, element: <WelcomeScreen />, handle: titled('appName') },
      {
        element: <ShellLayout />,
        children: [
          { path: routePaths.home, element: <HomeScreen />, handle: titled('nav.home') },
          {
            path: routePaths.categories,
            element: <CategoriesScreen />,
            handle: titled('nav.categories'),
          },
          { path: routePaths.cart, element: <CartScreen />, handle: titled('nav.cart') },
          {
            path: routePaths.checkout,
            element: <CheckoutScreen />,
            handle: titled('nav.checkout'),
          },
          { path: routePaths.orders, element: <OrdersScreen />, handle: titled('nav.orders') },
          { path: routePaths.account, element: <AccountScreen />, handle: titled('nav.account') },
          { path: routePaths.signIn, element: <SignInScreen />, handle: titled('nav.signIn') },
          { path: '*', element: <NotFoundScreen /> },
        ],
      },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes);
}
