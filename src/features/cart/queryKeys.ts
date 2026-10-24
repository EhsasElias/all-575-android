/** The signed-in customer's server cart. Other features invalidate it after they change the cart (e.g. a placed order). */
export const cartQueryKey = ['cart'] as const;
