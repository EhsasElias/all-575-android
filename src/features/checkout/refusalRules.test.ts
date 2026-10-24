import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/api';
import { pickAddress } from './addressChoice';
import { blockedReason } from './payReadiness';
import { linksFor, problemFromError, recoveryFor, REFUSALS } from './problems';
import { promoProblemFrom } from './promoProblem';
import { readQuote } from './quote';
import { describeSlotTimes, groupSlotsByDay } from './slots';
import { home, jeddah, quote, slots, work } from './testData';

const apiError = (status: number, code: string | null, details: Record<string, unknown> = {}) =>
  new ApiError({
    kind: status === 422 ? 'validation' : 'unexpected',
    status,
    message: 'x',
    ...(code === null ? {} : { code }),
    details,
  });

describe('problemFromError', () => {
  it('reads the fresh quote of quote_changed', () => {
    const problem = problemFromError(
      apiError(409, 'quote_changed', { quote: quote({ total: 2250 }) }),
    );

    expect(problem.kind).toBe('quote_changed');
    expect(problem.kind === 'quote_changed' && problem.quote.total).toBe(2250);
  });

  it('falls back to asking for a new quote when quote_changed has no usable one', () => {
    expect(problemFromError(apiError(409, 'quote_changed', {}))).toEqual({
      kind: 'refused',
      code: 'quote_expired',
    });
  });

  it.each(REFUSALS)('knows the refusal %s', (code) => {
    expect(problemFromError(apiError(409, code))).toEqual({ kind: 'refused', code });
    expect(['refresh-quote', 'refresh-slots', 'refresh-addresses', 'none']).toContain(
      recoveryFor({ kind: 'refused', code }),
    );
  });

  it('tells a lost answer from a refusal and from anything else', () => {
    expect(problemFromError(new ApiError({ kind: 'network', message: 'x' }))).toEqual({
      kind: 'offline',
    });
    expect(problemFromError(new ApiError({ kind: 'timeout', message: 'x' }))).toEqual({
      kind: 'offline',
    });
    expect(problemFromError(apiError(409, 'something_new'))).toEqual({ kind: 'failed' });
    expect(problemFromError(new Error('x'))).toEqual({ kind: 'failed' });
  });

  it('decides what to reload and which links to show', () => {
    expect(recoveryFor({ kind: 'refused', code: 'slot_full' })).toBe('refresh-slots');
    expect(recoveryFor({ kind: 'refused', code: 'out_of_stock' })).toBe('refresh-quote');
    expect(recoveryFor({ kind: 'offline' })).toBe('none');
    expect(linksFor({ kind: 'refused', code: 'out_of_stock' })).toEqual(['cart']);
    expect(linksFor({ kind: 'refused', code: 'address_not_serviceable' })).toEqual(['address']);
    expect(linksFor({ kind: 'failed' })).toEqual([]);
  });
});

describe('promoProblemFrom', () => {
  it('reads each promo refusal, with the minimum when there is one', () => {
    expect(promoProblemFrom(apiError(422, 'promo_expired'))).toEqual({
      code: 'promo_expired',
      minSubtotal: null,
    });
    expect(promoProblemFrom(apiError(422, 'promo_min_subtotal', { min_subtotal: 5000 }))).toEqual({
      code: 'promo_min_subtotal',
      minSubtotal: 5000,
    });
  });

  it('reads a rate limit and a bad code field, and leaves other failures alone', () => {
    expect(
      promoProblemFrom(new ApiError({ kind: 'rate-limited', status: 429, message: 'x' })),
    ).toEqual({ code: 'too_many_attempts' });
    expect(
      promoProblemFrom(
        new ApiError({
          kind: 'validation',
          status: 422,
          message: 'x',
          fieldErrors: { promo_code: ['bad'] },
        }),
      ),
    ).toEqual({ code: 'promo_invalid', minSubtotal: null });
    expect(promoProblemFrom(apiError(422, 'address_not_serviceable'))).toBeNull();
    expect(promoProblemFrom(new Error('x'))).toBeNull();
  });
});

describe('pickAddress', () => {
  it('prefers the chosen address, then the default, then the first deliverable one', () => {
    expect(pickAddress([home, work, jeddah], 3)?.id).toBe(3);
    expect(pickAddress([home, work, jeddah], null)?.id).toBe(1);
    expect(pickAddress([{ ...home, serviceable: false }, work], null)?.id).toBe(3);
  });

  it('never picks an address we do not deliver to', () => {
    expect(pickAddress([home, jeddah], 2)?.id).toBe(1);
    expect(pickAddress([jeddah], null)).toBeNull();
    expect(pickAddress([], null)).toBeNull();
  });
});

describe('blockedReason', () => {
  const ready = {
    addressChosen: true,
    slotChosen: true,
    quote: readQuote(quote()),
    quoteExpired: false,
    placing: false,
  };

  it('lets a complete checkout pay', () => {
    expect(blockedReason(ready)).toBeNull();
  });

  it.each([
    ['address', { addressChosen: false }],
    ['quote', { quote: null }],
    ['expired', { quoteExpired: true }],
    ['slot', { slotChosen: false }],
    ['unavailable', { quote: readQuote(quote({ can_checkout: false })) }],
  ] as const)('names %s as the first thing missing', (reason, change) => {
    expect(blockedReason({ ...ready, ...change })).toBe(reason);
  });
});

describe('delivery times', () => {
  it('groups by Saudi day, in order, and writes Saudi times', () => {
    const days = groupSlotsByDay(slots, 'en');

    expect(days.map((day) => [day.label, day.slots.map((slot) => slot.id)])).toEqual([
      ['Sunday, October 25', [8, 9, 14]],
      ['Monday, October 26', [15]],
    ]);
    expect(slots[0] && describeSlotTimes(slots[0], 'en')).toBe('9:00 AM – 11:00 AM');
    expect(slots[0] && describeSlotTimes(slots[0], 'ar')).toBe('9:00 ص – 11:00 ص');
  });

  it('puts a slot after Saudi midnight under the next day, not the UTC day', () => {
    const late = {
      id: 1,
      starts_at: '2026-10-25T21:30:00Z',
      ends_at: '2026-10-25T23:30:00Z',
      remaining: 1,
      available: true,
    };
    const [day] = groupSlotsByDay([late], 'en');

    expect(day?.label).toBe('Monday, October 26');
  });
});
