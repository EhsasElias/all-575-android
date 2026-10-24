import { describe, expect, it } from 'vitest';
import { buildRefund } from '../testData';
import { summarizeRefunds } from './refundSummary';

describe('the refund line of the order header', () => {
  it('is empty when there is no refund', () => {
    expect(summarizeRefunds([])).toBeNull();
  });

  it('is in progress while the refund is only requested', () => {
    expect(summarizeRefunds([buildRefund({ status: 'pending' })])).toEqual({
      kind: 'pending',
      at: '2026-10-24T18:00:00.000000Z',
    });
  });

  it('is done only once the provider confirmed it, dated by the confirmation', () => {
    const refund = buildRefund({
      status: 'succeeded',
      completed_at: '2026-10-27T09:00:00.000000Z',
    });
    expect(summarizeRefunds([refund])).toEqual({ kind: 'done', at: '2026-10-27T09:00:00.000000Z' });
  });

  it('stays in progress while any of several refunds is still pending', () => {
    const done = buildRefund({
      id: 'a',
      status: 'succeeded',
      completed_at: '2026-10-27T09:00:00.000000Z',
    });
    const waiting = buildRefund({ id: 'b', status: 'pending' });
    expect(summarizeRefunds([done, waiting])?.kind).toBe('pending');
  });

  it('reports a failed refund as failed', () => {
    const failed = buildRefund({ status: 'failed', completed_at: '2026-10-27T09:00:00.000000Z' });
    expect(summarizeRefunds([failed])?.kind).toBe('failed');
  });
});
