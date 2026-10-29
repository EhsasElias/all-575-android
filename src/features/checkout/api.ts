import { ApiError, http, type Data, type Schemas } from '@/shared/api';
import { asString, isRecord } from './json';
import { isPayment, type PayMethod, type Payment } from './payment';
import { readQuote, type Quote } from './quote';

export type Address = Schemas['AddressResource'];
export type Slot = Schemas['SlotResource'];
export type Order = Schemas['OrderDetailResource'];
export type DeliveryZone = Schemas['ZoneResource'];

function unexpected(what: string): ApiError {
  return new ApiError({ kind: 'unexpected', message: `The server returned an unexpected ${what}` });
}

export async function listAddresses(signal: AbortSignal): Promise<Address[]> {
  return (await http.get<Data<Address[]>>('/addresses', { signal })).data;
}

export async function listSlots(addressId: number, signal: AbortSignal): Promise<Slot[]> {
  const query = { address_id: addressId };
  return (await http.get<Data<Slot[]>>('/delivery/slots', { query, signal })).data;
}

/** The delivery fee and free-delivery threshold of the zone a point is in, or null outside every zone. */
export async function resolveDeliveryZone(
  address: Pick<Address, 'lat' | 'lng'>,
  signal: AbortSignal,
): Promise<DeliveryZone | null> {
  const query = { lat: address.lat, lng: address.lng };
  const body = await http.get<Data<{ zone: DeliveryZone | null }>>('/zones/resolve', {
    query,
    signal,
  });
  return body.data.zone;
}

export async function requestQuote(
  request: { addressId: number; promoCode: string | null },
  signal: AbortSignal,
): Promise<Quote> {
  const body = await http.post<unknown>(
    '/quotes',
    {
      address_id: request.addressId,
      ...(request.promoCode === null ? {} : { promo_code: request.promoCode }),
    },
    { signal },
  );
  const quote = isRecord(body) ? readQuote(body.data) : null;
  if (quote === null) throw unexpected('quote');
  return quote;
}

export type CheckoutRequest = {
  purchaseOrderReference?: string;
  quoteId: string;
  slotId: number;
  method: PayMethod;
};

export type PlacedOrder = {
  orderId: string;
  /** Already confirmed, e.g. a promo code covered the whole total: there is nothing to pay. */
  confirmed: boolean;
  /** The charge the customer must complete, or null when there is nothing to pay. */
  payment: Payment | null;
};

function readPlacedOrder(body: unknown): PlacedOrder | null {
  const data = isRecord(body) ? body.data : null;
  const order = isRecord(data) ? data.order : null;
  if (!isRecord(data) || !isRecord(order)) return null;
  const orderId = asString(order.id);
  const payment = data.payment === null ? null : data.payment;
  if (orderId === null || (payment !== null && !isPayment(payment))) return null;
  return { orderId, confirmed: order.status === 'confirmed', payment };
}

/** The key makes a retry of the same attempt safe: the server answers with the same order instead of a second one. */
export async function placeOrder(
  request: CheckoutRequest,
  idempotencyKey: string,
): Promise<PlacedOrder> {
  const body = await http.post<unknown>(
    '/checkout',
    {
      quote_id: request.quoteId,
      slot_id: request.slotId,
      payment_method: request.method,
      purchase_order_reference:
        request.purchaseOrderReference === '' ? undefined : request.purchaseOrderReference,
    },
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  const placed = readPlacedOrder(body);
  if (placed === null) throw unexpected('order');
  return placed;
}

export async function getOrder(orderId: string, signal: AbortSignal): Promise<Order> {
  return (await http.get<Data<Order>>(`/orders/${encodeURIComponent(orderId)}`, { signal })).data;
}

export async function getPayment(paymentId: string, signal: AbortSignal): Promise<Payment> {
  const body = await http.get<unknown>(`/payments/${encodeURIComponent(paymentId)}`, { signal });
  const payment = isRecord(body) ? body.data : null;
  if (!isPayment(payment)) throw unexpected('payment');
  return payment;
}

/** Starts a new payment attempt for an unpaid order whose stock is still held. */
export async function retryPayment(orderId: string, method: PayMethod): Promise<Payment> {
  const body = await http.post<unknown>(`/orders/${encodeURIComponent(orderId)}/payments`, {
    payment_method: method,
  });
  const payment = isRecord(body) ? body.data : null;
  if (!isPayment(payment)) throw unexpected('payment');
  return payment;
}
