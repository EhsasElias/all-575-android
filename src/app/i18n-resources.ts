import { accountLocales } from '@/features/account';
import { aftercareLocales } from '@/features/aftercare';
import { addressesLocales } from '@/features/addresses';
import { authLocales } from '@/features/auth';
import { cartLocales } from '@/features/cart';
import { catalogLocales } from '@/features/catalog';
import { checkoutLocales } from '@/features/checkout';
import { ordersLocales } from '@/features/orders';
import { testServerLocales } from '@/features/testserver';
import { welcomeLocales } from '@/features/welcome';
import { commonLocales } from '@/shared/i18n';
import { appearanceLocales } from '@/shared/theme';
import { accessLocales } from '@/shared/security';
import { navigationLocales } from './layout/navigationLocales';

export const appResources = {
  en: {
    access: accessLocales.en,
    navigation: navigationLocales.en,
    appearance: appearanceLocales.en,
    aftercare: aftercareLocales.en,
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
    access: accessLocales.ar,
    navigation: navigationLocales.ar,
    appearance: appearanceLocales.ar,
    aftercare: aftercareLocales.ar,
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
  fr: {
    access: accessLocales.fr,
    navigation: navigationLocales.fr,
    appearance: appearanceLocales.fr,
    aftercare: aftercareLocales.fr,
    common: commonLocales.fr,
    welcome: welcomeLocales.fr,
    catalog: catalogLocales.fr,
    cart: cartLocales.fr,
    checkout: checkoutLocales.fr,
    orders: ordersLocales.fr,
    account: accountLocales.fr,
    addresses: addressesLocales.fr,
    auth: authLocales.fr,
    testserver: testServerLocales.fr,
  },
};
