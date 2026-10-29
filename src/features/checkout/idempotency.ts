import { isApiError } from '@/shared/api';
import type { CheckoutRequest } from './api';

export type AttemptKeys = {
  /** The same key for the same quote, slot and method; a new one as soon as any of them changes. */
  keyFor: (request: CheckoutRequest) => string;
  /** Forgets the key, so the next attempt gets a new one. */
  renew: () => void;
};

export function createAttemptKeys(generate: () => string = () => crypto.randomUUID()): AttemptKeys {
  let current: { signature: string; key: string } | null = null;

  return {
    keyFor: ({ quoteId, slotId, method, purchaseOrderReference }) => {
      const signature = JSON.stringify([quoteId, slotId, method, purchaseOrderReference ?? '']);
      if (current?.signature !== signature) current = { signature, key: generate() };
      return current.key;
    },
    renew: () => {
      current = null;
    },
  };
}

/**
 * A retry after a lost answer must reuse the key (the server may have placed the order: it then answers with
 * that same order). Once the server has answered with a refusal, nothing more will come of that key (a replay
 * would hand back the refused, possibly cancelled, order), so the next attempt starts fresh.
 */
export function shouldRenewKey(error: unknown): boolean {
  if (!isApiError(error) || error.code !== null) return true;
  // No answer, a failure on the server's side, or a 2xx we could not read: the order may exist.
  const unanswered = ['network', 'timeout', 'server', 'rate-limited'].includes(error.kind);
  const unreadable = error.kind === 'unexpected' && (error.status === null || error.status < 300);
  return !(unanswered || unreadable);
}
