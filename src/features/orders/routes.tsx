import type { RouteObject } from 'react-router';
import { routePaths, titled } from '@/shared/lib';
import { OrderDetailScreen } from './detail/OrderDetailScreen';
import { OrdersScreen } from './list/OrdersScreen';
import { SpendingScreen } from './spending/SpendingScreen';

/**
 * Orders, one order, and the spending report. The router wraps all of these in RequireAuth.
 * The report lives under /account but belongs to this feature.
 */
export const ordersRoutes: RouteObject[] = [
  {
    path: routePaths.orders,
    element: <OrdersScreen />,
    handle: titled((t) => t('titles.list', { ns: 'orders' })),
  },
  {
    path: routePaths.order,
    element: <OrderDetailScreen />,
    handle: titled((t) => t('titles.detail', { ns: 'orders' })),
  },
  {
    path: routePaths.spending,
    element: <SpendingScreen />,
    handle: titled((t) => t('titles.spending', { ns: 'orders' })),
  },
];
