import type { RouteObject } from 'react-router';
import { routePaths, titled } from '@/shared/lib';
import { AddressesScreen } from './AddressesScreen';
import { AddressFormScreen } from './AddressFormScreen';

/** Routes that need a signed-in customer; the router wraps them in RequireAuth. */
export const addressesRoutes: RouteObject[] = [
  {
    path: routePaths.addresses,
    element: <AddressesScreen />,
    handle: titled((t) => t('titles.list', { ns: 'addresses' })),
  },
  {
    path: routePaths.addressNew,
    element: <AddressFormScreen />,
    handle: titled((t) => t('titles.new', { ns: 'addresses' })),
  },
  {
    path: routePaths.addressEdit,
    element: <AddressFormScreen />,
    handle: titled((t) => t('titles.edit', { ns: 'addresses' })),
  },
];
