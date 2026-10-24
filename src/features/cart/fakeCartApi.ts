import type { FakeRoutes } from '@/test/fakeApi';
import { MAX_QUANTITY_PER_LINE } from './cartRules';
import type { LineAvailability } from './cartTypes';
import { CATALOG, cartResource, serverLine, type CartLineResource } from './testData';

/** What the server says about a variant's stock for an address (null when the request names none). */
export type StockAt = (variantId: number, addressId: number | null) => LineAvailability;

type QuantityBody = { quantity: number };

function isQuantityBody(body: unknown): body is QuantityBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'quantity' in body &&
    typeof body.quantity === 'number'
  );
}

type MergeBody = { items: { variant_id: number; quantity: number }[] };

function isMergeBody(body: unknown): body is MergeBody {
  return typeof body === 'object' && body !== null && 'items' in body && Array.isArray(body.items);
}

function lineFor(variantId: number, quantity: number): CartLineResource | null {
  const snapshot = CATALOG.find((candidate) => candidate.variantId === variantId);
  return snapshot ? serverLine(snapshot, quantity) : null;
}

/**
 * A small in-memory cart server for tests: the routes the cart uses, answering like the real API
 * (quantity 0 removes, more than 20 is `quantity_out_of_range`, an unknown variant is `variant_unavailable`,
 * a merge adds to what is there and skips lines it does not know).
 */
export function createFakeCartApi(
  initial: readonly CartLineResource[] = [],
  stock: StockAt = () => 'unknown',
) {
  let lines: CartLineResource[] = [...initial];
  const body = () => ({ data: cartResource(lines) });

  const routes: FakeRoutes = {
    // Stock is only known for a delivery address, as in the real API.
    'GET /cart': ({ query }) => {
      const addressId = query.has('address_id') ? Number(query.get('address_id')) : null;
      const known = lines.map((line) => ({
        ...line,
        availability: stock(line.variant_id, addressId),
      }));
      return { body: { data: cartResource(known) } };
    },
    'PUT /cart/items/:variant': (request) => {
      const variantId = Number(request.params.variant);
      if (!isQuantityBody(request.body)) return { status: 422, body: { message: 'Invalid' } };
      const { quantity } = request.body;
      if (quantity > MAX_QUANTITY_PER_LINE) {
        return {
          status: 422,
          body: { message: 'Quantity must be between 0 and 20.', code: 'quantity_out_of_range' },
        };
      }
      if (quantity === 0) {
        lines = lines.filter((line) => line.variant_id !== variantId);
        return { body: body() };
      }
      const line = lineFor(variantId, quantity);
      if (line === null) {
        return {
          status: 404,
          body: { message: 'This product is not available.', code: 'variant_unavailable' },
        };
      }
      lines = lines.some((existing) => existing.variant_id === variantId)
        ? lines.map((existing) => (existing.variant_id === variantId ? line : existing))
        : [...lines, line];
      return { body: body() };
    },
    'POST /cart/merge': (request) => {
      if (!isMergeBody(request.body)) return { status: 422, body: { message: 'Invalid' } };
      for (const item of request.body.items) {
        const existing = lines.find((line) => line.variant_id === item.variant_id)?.quantity ?? 0;
        const line = lineFor(
          item.variant_id,
          Math.min(MAX_QUANTITY_PER_LINE, existing + item.quantity),
        );
        if (line === null) continue;
        lines =
          existing === 0
            ? [...lines, line]
            : lines.map((candidate) =>
                candidate.variant_id === item.variant_id ? line : candidate,
              );
      }
      return { body: body() };
    },
    'DELETE /cart': () => {
      lines = [];
      return { status: 204 };
    },
  };

  return { routes, lines: () => [...lines] };
}
