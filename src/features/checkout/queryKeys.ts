export const checkoutKeys = {
  addresses: ['checkout', 'addresses'] as const,
  slots: (addressId: number | null) => ['checkout', 'slots', addressId] as const,
  // `visit` keeps a quote from an earlier visit (when the cart may have been different) from being reused.
  quote: (visit: string, addressId: number | null, promoCode: string | null) =>
    ['checkout', 'quote', visit, addressId, promoCode] as const,
  zone: (addressId: number | null) => ['checkout', 'zone', addressId] as const,
  order: (orderId: string) => ['checkout', 'order', orderId] as const,
  payment: (paymentId: string | null) => ['checkout', 'payment', paymentId] as const,
};
