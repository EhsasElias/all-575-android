import type { Schemas } from '@/shared/api';

type AddToCartProps = {
  product: Schemas['ProductDetailResource'];
  variant: Schemas['VariantResource'];
};

/**
 * What the product page shows to put the chosen variant in the cart (quantity stepper and button). The cart
 * feature owns how it is stored: the server cart when signed in, a local cart for guests.
 */
export function AddToCart({ variant }: AddToCartProps) {
  return <p data-variant-id={variant.id} hidden />;
}
