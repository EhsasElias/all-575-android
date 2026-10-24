import type { OrderRefund } from '../types';

export type RefundSummary =
  { kind: 'pending'; at: string } | { kind: 'done'; at: string } | { kind: 'failed'; at: string };

function latest(dates: string[]): string | null {
  return dates.reduce<string | null>(
    (best, date) => (best === null || Date.parse(date) > Date.parse(best) ? date : best),
    null,
  );
}

/**
 * The one refund line of the order header. A refund is "done" only when every refund has succeeded;
 * while any is still pending the honest answer is "in progress".
 */
export function summarizeRefunds(refunds: OrderRefund[]): RefundSummary | null {
  const pending = refunds.filter((refund) => refund.status === 'pending');
  if (pending.length > 0) {
    return { kind: 'pending', at: latest(pending.map((refund) => refund.requested_at)) ?? '' };
  }

  const succeeded = refunds.filter((refund) => refund.status === 'succeeded');
  if (succeeded.length > 0) {
    const finished = succeeded.map((refund) => refund.completed_at ?? refund.requested_at);
    return { kind: 'done', at: latest(finished) ?? '' };
  }

  const failed = refunds.filter((refund) => refund.status === 'failed');
  if (failed.length === 0) return null;
  return {
    kind: 'failed',
    at: latest(failed.map((refund) => refund.completed_at ?? refund.requested_at)) ?? '',
  };
}
