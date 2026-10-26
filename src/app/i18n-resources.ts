import { accountLocales } from '@/features/account';
import { addressesLocales } from '@/features/addresses';
import { authLocales } from '@/features/auth';
import { cartLocales } from '@/features/cart';
import { catalogLocales } from '@/features/catalog';
import { checkoutLocales } from '@/features/checkout';
import { ordersLocales } from '@/features/orders';
import { testServerLocales } from '@/features/testserver';
import { welcomeLocales } from '@/features/welcome';
import { commonLocales } from '@/shared/i18n';

export const appResources = {
  en: {
    common: commonLocales.en,
    welcome: welcomeLocales.en,
    catalog: catalogLocales.en,
    cart: cartLocales.en,
    checkout: checkoutLocales.en,
    orders: ordersLocales.en,
    account: accountLocales.en,
    addresses: addressesLocales.en,
    auth: authLocales.en,
    testserver: testServerLocales.en,
  },
  ar: {
    common: commonLocales.ar,
    welcome: welcomeLocales.ar,
    catalog: catalogLocales.ar,
    cart: cartLocales.ar,
    checkout: checkoutLocales.ar,
    orders: ordersLocales.ar,
    account: accountLocales.ar,
    addresses: addressesLocales.ar,
    auth: authLocales.ar,
    testserver: testServerLocales.ar,
  },
};
