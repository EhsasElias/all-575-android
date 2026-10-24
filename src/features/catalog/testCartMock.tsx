import type { ComponentProps } from 'react';
import type { AddToCart } from '@/features/cart';

/**
 * Stands in for the cart feature's button, so these tests keep working while that feature changes. It shows
 * which variant the product page handed over.
 */
export function FakeAddToCart({ variant }: ComponentProps<typeof AddToCart>) {
  return (
    <button type="button" data-testid="add-to-cart" data-variant-id={variant.id}>
      Add {variant.sku}
    </button>
  );
}
