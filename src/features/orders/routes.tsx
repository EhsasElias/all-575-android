import type { RouteObject } from 'react-router';
import { routePaths, titled } from '@/shared/lib';
import { OrdersScreen } from './OrdersScreen';

/** All of these need a signed-in customer. */
export const ordersRoutes: RouteObject[] = [
  { path: routePaths.orders, element: <OrdersScreen />, handle: titled((t) => t('nav.orders')) },
];
