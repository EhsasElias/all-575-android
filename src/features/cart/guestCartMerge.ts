import type { QueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { isPermanentRefusal, refusalFromError } from './cartRefusal';
import type { CartRefusal } from './cartTypes';
import { toMergeItems } from './guestCartRules';
import { guestCartStore } from './guestCartStore';
import { cartQueryKey } from './queryKeys';
import { mergeCartItems } from './serverCart';

export type MergeEffects = {
  queryClient: QueryClient;
  onMerged: () => void;
  /** `willRetry`: the lines stay on the device and are tried again on the next mount. */
  onFailed: (reason: CartRefusal, willRetry: boolean) => void;
};

// Whether the last attempt failed. The lines then stay on the device and are tried again on the next mount.
let lastAttemptFailed = false;
const failureListeners = new Set<() => void>();

function setLastAttemptFailed(value: boolean): void {
  if (lastAttemptFailed === value) return;
  lastAttemptFailed = value;
  for (const listener of failureListeners) listener();
}

function subscribeToFailure(listener: () => void): () => void {
  failureListeners.add(listener);
  return () => {
    failureListeners.delete(listener);
  };
}

const hasGuestItems = (): boolean => guestCartStore.getItemCount() > 0;

/**
 * True while a signed-in customer still has device lines the merge has not moved to the server. The cart reads
 * as loading then, so it never claims to be empty just before their items appear.
 */
export function useGuestLinesAwaitingMerge(): boolean {
  const hasLines = useSyncExternalStore(guestCartStore.subscribe, hasGuestItems);
  const failed = useSyncExternalStore(subscribeToFailure, () => lastAttemptFailed);
  return hasLines && !failed;
}

async function mergeNow({ queryClient, onMerged, onFailed }: MergeEffects): Promise<void> {
  const lines = guestCartStore.getSnapshot();
  if (lines.length === 0) return;

  setLastAttemptFailed(false);
  try {
    await mergeCartItems(toMergeItems(lines));
  } catch (error) {
    if (isPermanentRefusal(error)) {
      // Trying again would be refused again, and the lines would sit on the device for ever, out of sight.
      guestCartStore.clear();
      onFailed(refusalFromError(error), false);
      return;
    }
    setLastAttemptFailed(true);
    onFailed(refusalFromError(error), true);
    return;
  }

  // The server adds quantities, so the device lines must go the moment it has them, never before a retry could repeat it.
  guestCartStore.clear();
  void queryClient.invalidateQueries({ queryKey: cartQueryKey });
  onMerged();
}

let inFlight: Promise<void> | null = null;

/**
 * Sends the device cart to the server once. Calls made while a merge is running (a second mounted copy, React's
 * double effect in development) share it, so the lines can never be added twice.
 */
export function mergeGuestCartOnce(effects: MergeEffects): Promise<void> {
  inFlight ??= mergeNow(effects).finally(() => {
    inFlight = null;
  });
  return inFlight;
}
