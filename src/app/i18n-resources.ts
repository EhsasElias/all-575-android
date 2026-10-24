import { accountLocales } from '@/features/account';
import { authLocales } from '@/features/auth';
import { cartLocales } from '@/features/cart';
import { catalogLocales } from '@/features/catalog';
import { checkoutLocales } from '@/features/checkout';
import { ordersLocales } from '@/features/orders';
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
    auth: authLocales.en,
  },
  ar: {
    common: commonLocales.ar,
    welcome: welcomeLocales.ar,
    catalog: catalogLocales.ar,
    cart: cartLocales.ar,
    checkout: checkoutLocales.ar,
    orders: ordersLocales.ar,
    account: accountLocales.ar,
    auth: authLocales.ar,
  },
};
