import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { cartQueryKey } from '@/features/cart';
import { installFakeApi } from '@/test/fakeApi';
import { refusal } from './checkoutActions';
import { quote } from './testData';
import { useQuoteFlow } from './useQuoteFlow';

function setup() {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe('useQuoteFlow and the cart', () => {
  it('prices the cart again when the cart is invalidated elsewhere (for example after the sign-in merge)', async () => {
    let total = 1150;
    const api = installFakeApi({
      'POST /quotes': () => ({ status: 201, body: { data: quote({ total }) } }),
    });
    const { client, wrapper } = setup();
    // The cart query the shell keeps alive; the merge invalidates it when it finishes.
    client.setQueryData(cartQueryKey, { lines: [] });
    const { result } = renderHook(() => useQuoteFlow(1), { wrapper });
    await waitFor(() => {
      expect(result.current.quote?.total).toBe(1150);
    });

    total = 2150;
    await act(async () => {
      await client.invalidateQueries({ queryKey: cartQueryKey });
    });

    await waitFor(() => {
      expect(result.current.quote?.total).toBe(2150);
    });
    expect(api.requests().filter((request) => request === 'POST /quotes')).toHaveLength(2);
  });

  it('leaves an empty answer behind as soon as the cart has items', async () => {
    let empty = true;
    installFakeApi({
      'POST /quotes': () =>
        empty ? refusal(422, 'cart_empty') : { status: 201, body: { data: quote() } },
    });
    const { client, wrapper } = setup();
    client.setQueryData(cartQueryKey, { lines: [] });
    const { result } = renderHook(() => useQuoteFlow(1), { wrapper });
    await waitFor(
      () => {
        expect(result.current.error).not.toBeNull();
      },
      { timeout: 4000 },
    );

    empty = false;
    await act(async () => {
      await client.invalidateQueries({ queryKey: cartQueryKey });
    });

    await waitFor(() => {
      expect(result.current.quote?.total).toBe(2150);
    });
    expect(result.current.error).toBeNull();
  });

  it('does not ask for a price without an address', () => {
    const api = installFakeApi();
    const { wrapper } = setup();

    const { result } = renderHook(() => useQuoteFlow(null), { wrapper });

    expect(result.current.quote).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(api.requests()).toEqual([]);
  });
});
