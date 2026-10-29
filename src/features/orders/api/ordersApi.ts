import { http, type Data, type HttpClient, type Page } from '@/shared/api';
import type { DateRange, OrderDetail, OrderSummary, Review, SpendingReport } from '../types';

export type Download = Awaited<ReturnType<HttpClient['download']>>;

/** The page to fetch next: null is the first page. */
export type Cursor = string | null;
export type OrderFilters = {
  status?: string | undefined;
  q?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
};

export type SpendingFilters = {
  category?: string | undefined;
  seller?: string | undefined;
  status?: string | undefined;
};

export type ReviewInput = { rating: number; body: string | null };

export type DeliveryCode = { code: string; expires_at: string };

const segment = (value: string | number): string => encodeURIComponent(String(value));

export function fetchOrdersPage(
  cursor: Cursor,
  signal: AbortSignal,
  filters: OrderFilters = {},
): Promise<Page<OrderSummary>> {
  return http.get<Page<OrderSummary>>('/orders', {
    query: { ...filters, cursor: cursor ?? undefined },
    signal,
  });
}

export async function fetchOrder(orderId: string, signal: AbortSignal): Promise<OrderDetail> {
  const { data } = await http.get<Data<OrderDetail>>(`/orders/${segment(orderId)}`, { signal });
  return data;
}

export async function cancelOrder(orderId: string): Promise<OrderDetail> {
  const { data } = await http.post<Data<OrderDetail>>(`/orders/${segment(orderId)}/cancel`);
  return data;
}

export async function fetchDeliveryCode(
  orderId: string,
  suborderId: string,
  signal: AbortSignal,
): Promise<DeliveryCode> {
  const path = `/orders/${segment(orderId)}/suborders/${segment(suborderId)}/delivery-code`;
  const { data } = await http.get<Data<DeliveryCode>>(path, { signal });
  return data;
}

export async function createReview(
  orderId: string,
  productSlug: string,
  input: ReviewInput,
): Promise<Review> {
  const { data } = await http.post<Data<Review>>(`/orders/${segment(orderId)}/reviews`, {
    product_slug: productSlug,
    ...input,
  });
  return data;
}

export async function updateReview(reviewId: number, input: ReviewInput): Promise<Review> {
  const { data } = await http.patch<Data<Review>>(`/reviews/${segment(reviewId)}`, input);
  return data;
}

export async function fetchSpendingReport(
  range: DateRange,
  signal: AbortSignal,
  filters: SpendingFilters = {},
): Promise<SpendingReport> {
  const { data } = await http.get<Data<SpendingReport>>('/me/reports/spending', {
    query: { from: range.from, to: range.to, ...filters },
    signal,
  });
  return data;
}

/** The CSV as raw bytes, so the UTF-8 byte-order mark that Excel needs for Arabic text survives. */
export function downloadSpendingCsv(
  range: DateRange,
  signal: AbortSignal,
  filters: SpendingFilters = {},
): Promise<Download> {
  return http.download('/me/reports/spending.csv', {
    query: { from: range.from, to: range.to, ...filters },
    signal,
  });
}
