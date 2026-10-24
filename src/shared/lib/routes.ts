/**
 * Every URL of the app. Patterns (with `:param`) go to the router, `routeTo` builds real links.
 * Keep both here so a feature never hard-codes a path that another feature owns.
 */
export const routePaths = {
  root: '/',
  welcome: '/welcome',
  home: '/home',
  categories: '/categories',
  categoryProducts: '/categories/:categoryId',
  search: '/search',
  product: '/products/:slug',
  seller: '/sellers/:slug',
  cart: '/cart',
  checkout: '/checkout',
  checkoutPayment: '/checkout/payment/:orderId',
  orders: '/orders',
  order: '/orders/:orderId',
  account: '/account',
  profile: '/account/profile',
  sessions: '/account/sessions',
  addresses: '/account/addresses',
  addressNew: '/account/addresses/new',
  addressEdit: '/account/addresses/:addressId',
  spending: '/account/spending',
  terms: '/legal/terms',
  privacy: '/legal/privacy',
  signIn: '/sign-in',
} as const;

const segment = (value: string | number): string => encodeURIComponent(String(value));

export const routeTo = {
  categoryProducts: (categoryId: string | number) => `/categories/${segment(categoryId)}`,
  product: (slug: string) => `/products/${segment(slug)}`,
  seller: (slug: string) => `/sellers/${segment(slug)}`,
  checkoutPayment: (orderId: string | number) => `/checkout/payment/${segment(orderId)}`,
  order: (orderId: string | number) => `/orders/${segment(orderId)}`,
  addressEdit: (addressId: string | number) => `/account/addresses/${segment(addressId)}`,
};
