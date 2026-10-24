import type { RouteObject } from 'react-router';
import { routePaths, titled } from '@/shared/lib';
import { CheckoutScreen } from './CheckoutScreen';
import { PaymentScreen } from './PaymentScreen';

/** All of these need a signed-in customer. */
export const checkoutRoutes: RouteObject[] = [
  {
    path: routePaths.checkout,
    element: <CheckoutScreen />,
    handle: titled((t) => t('nav.checkout')),
  },
  {
    path: routePaths.checkoutPayment,
    element: <PaymentScreen />,
    handle: titled((t) => t('titles.payment', { ns: 'checkout' })),
  },
];
