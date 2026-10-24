import type { Schemas } from '@/shared/api';
import type { operations } from '@/shared/api/schema';

export type OrderSummary = Schemas['OrderResource'];
export type OrderStatus = Schemas['OrderStatus'];
export type OrderDetail = Schemas['OrderDetailResource'];
export type Suborder = OrderDetail['suborders'][number];
export type SuborderStatus = Suborder['status'];
export type SuborderItem = Suborder['items'][number];
export type OrderPayment = OrderDetail['payments'][number];
export type OrderRefund = OrderDetail['refunds'][number];
export type TimelineEvent = OrderDetail['timeline'][number];
export type Review = Schemas['ReviewResource'];

export type SpendingReport =
  operations['spendingReport.show']['responses'][200]['content']['application/json']['data'];
export type SpendingRow = SpendingReport['rows'][number];

/** Calendar days as `YYYY-MM-DD`, in Saudi time. */
export type DateRange = { from: string; to: string };
