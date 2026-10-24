import type { RouteObject } from 'react-router';
import { routePaths, titled } from '@/shared/lib';
import { CartScreen } from './CartScreen';

/** Public: a guest's cart lives on the device until sign-in. */
export const cartRoutes: RouteObject[] = [
  { path: routePaths.cart, element: <CartScreen />, handle: titled((t) => t('nav.cart')) },
];
