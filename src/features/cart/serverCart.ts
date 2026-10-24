import { queryOptions } from '@tanstack/react-query';
import { http, type Data, type Schemas } from '@/shared/api';
import { summarize } from './cartRules';
import type { CartContents, CartLine } from './cartTypes';
import type { MergeItem } from './guestCartRules';
import { fromApiName } from './localizedText';
import { cartQueryKey } from './queryKeys';

type CartResource = Schemas['CartResource'];

/** The contract types some amounts as plain numbers; money is integer halalas, so anything else is recomputed. */
function halalas(value: number, fallback: number): number {
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
}

function toLine(line: CartResource['lines'][number]): CartLine {
  return {
    variantId: line.variant_id,
    productSlug: line.product_slug,
    name: line.name,
    variantName: fromApiName(line.variant_name),
    imageUrl: line.image_url,
    quantity: line.quantity,
    unitPrice: line.unit_price,
    linePrice: halalas(line.line_price, line.unit_price * line.quantity),
    availability: line.availability,
  };
}

export function toCartContents(resource: CartResource): CartContents {
  const lines = resource.lines.map(toLine);
  const computed = summarize(lines);
  return {
    lines,
    itemsCount: halalas(resource.items_count, computed.itemsCount),
    subtotal: halalas(resource.subtotal, computed.subtotal),
  };
}

/** The signed-in customer's cart. The tab badge, the product page and the cart screen all read this one entry. */
export const serverCartQuery = queryOptions({
  queryKey: cartQueryKey,
  queryFn: async ({ signal }) => {
    const { data } = await http.get<Data<CartResource>>('/cart', { signal });
    return toCartContents(data);
  },
});

/** The server cart answers every change with the whole cart, so nothing needs a second request. */
export async function putCartItem(variantId: number, quantity: number): Promise<CartContents> {
  const { data } = await http.put<Data<CartResource>>(`/cart/items/${variantId}`, { quantity });
  return toCartContents(data);
}

export async function mergeCartItems(items: readonly MergeItem[]): Promise<CartContents> {
  const { data } = await http.post<Data<CartResource>>('/cart/merge', { items });
  return toCartContents(data);
}

export async function clearServerCart(): Promise<void> {
  await http.delete('/cart');
}
