import { useCallback, useEffect, useRef, useState } from 'react';
import { errorCode } from '@/shared/api';
import { fetchDeliveryCode } from '../api/ordersApi';

/** How long the code stays on screen: long enough to read out, short enough not to be left lying around. */
export const CODE_VISIBLE_MS = 60_000;

export type DeliveryCodeState =
  | { status: 'hidden' }
  | { status: 'loading' }
  | { status: 'shown'; code: string; expiresAt: string }
  | { status: 'error'; reason: 'unavailable' | 'failed' };

const HIDDEN: DeliveryCodeState = { status: 'hidden' };

/**
 * Fetches the hand-over code only when asked and keeps it in this component's state alone: never in the
 * query cache, storage, the URL or a log. It disappears after a minute, when the tab is hidden, and on leaving.
 */
export function useDeliveryCode(orderId: string, suborderId: string) {
  const [state, setState] = useState<DeliveryCodeState>(HIDDEN);
  const request = useRef<AbortController | null>(null);
  const shown = state.status === 'shown';

  useEffect(
    () => () => {
      request.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!shown) return;
    const timer = setTimeout(() => {
      setState(HIDDEN);
    }, CODE_VISIBLE_MS);
    const hideWhenAway = () => {
      if (document.visibilityState === 'hidden') setState(HIDDEN);
    };
    document.addEventListener('visibilitychange', hideWhenAway);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', hideWhenAway);
    };
  }, [shown]);

  const show = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setState({ status: 'loading' });
    try {
      const result = await fetchDeliveryCode(orderId, suborderId, controller.signal);
      setState({ status: 'shown', code: result.code, expiresAt: result.expires_at });
    } catch (error) {
      if (controller.signal.aborted) return;
      const reason = errorCode(error) === 'delivery_code_unavailable' ? 'unavailable' : 'failed';
      setState({ status: 'error', reason });
    }
  }, [orderId, suborderId]);

  const hide = useCallback(() => {
    setState(HIDDEN);
  }, []);

  return { state, show, hide };
}
