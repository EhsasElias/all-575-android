import { http, type Data, type Schemas } from '@/shared/api';
import type { LineAvailability } from './cartTypes';

type Address = Schemas['AddressResource'];
type CartResource = Schemas['CartResource'];

export type LineStock = { variantId: number; availability: LineAvailability };

/** Stock is counted per delivery area, so the cart can only judge lines for an address the customer already has. */
export function pickDeliveryAddress(addresses: readonly Address[]): Address | undefined {
  const deliverable = addresses.filter((address) => address.serviceable);
  return deliverable.find((address) => address.is_default) ?? deliverable[0];
}

export async function fetchDeliveryAddressId(signal: AbortSignal): Promise<number | null> {
  const { data } = await http.get<Data<Address[]>>('/addresses', { signal });
  return pickDeliveryAddress(data)?.id ?? null;
}

/** GET /cart with an address is the only call that reports stock per line. */
export async function fetchLineStock(addressId: number, signal: AbortSignal): Promise<LineStock[]> {
  const { data } = await http.get<Data<CartResource>>('/cart', {
    query: { address_id: addressId },
    signal,
  });
  return data.lines.map((line) => ({
    variantId: line.variant_id,
    availability: line.availability,
  }));
}

export function stockByVariant(stock: LineStock[]): ReadonlyMap<number, LineAvailability> {
  return new Map(stock.map((line) => [line.variantId, line.availability]));
}
