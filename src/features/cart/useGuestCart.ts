import { useMemo, useSyncExternalStore } from 'react';
import { useStoreInfo } from '@/shared/storeInfo';
import { countItems, priceGuestLines } from './cartRules';
import type { Cart, CartAddition, CartChange, CartStatus, LineSnapshot } from './cartTypes';
import { addGuestLine, setGuestQuantity, type GuestEdit } from './guestCartRules';
import { guestCartStore } from './guestCartStore';

function commit(edit: GuestEdit): CartChange {
  if (!edit.ok) return edit;
  guestCartStore.write(edit.lines);
  return { ok: true };
}

function setQuantity(variantId: number, quantity: number): Promise<CartChange> {
  return Promise.resolve(
    commit(setGuestQuantity(guestCartStore.getSnapshot(), variantId, quantity)),
  );
}

function addItem(snapshot: LineSnapshot, amount: number): Promise<CartAddition> {
  const result = addGuestLine(guestCartStore.getSnapshot(), snapshot, amount);
  if (!result.ok) return Promise.resolve(result);
  guestCartStore.write(result.lines);
  return Promise.resolve({ ok: true, quantity: result.quantity, capped: result.capped });
}

function clear(): Promise<CartChange> {
  guestCartStore.clear();
  return Promise.resolve({ ok: true });
}

/**
 * A guest's cart lives on the device. Everything costs the one store price, so prices come from `GET /store`;
 * availability is not known here and is checked at checkout.
 */
export function useGuestCart(): Cart {
  const lines = useSyncExternalStore(guestCartStore.subscribe, guestCartStore.getSnapshot);
  const storeInfo = useStoreInfo();
  const unitPrice = storeInfo.data?.price.gross;

  return useMemo<Cart>(() => {
    // An empty cart needs no price, so it never waits for the store call.
    const priced = lines.length === 0 || unitPrice !== undefined;
    const contents = priceGuestLines(priced ? lines : [], unitPrice ?? 0);
    const status: CartStatus = priced ? 'ready' : storeInfo.isError ? 'error' : 'loading';
    return {
      kind: 'guest',
      status,
      ...contents,
      itemsCount: countItems(lines),
      setQuantity,
      addItem,
      remove: (variantId) => setQuantity(variantId, 0),
      clear,
      refetch: () => {
        void storeInfo.refetch();
      },
    };
  }, [lines, unitPrice, storeInfo]);
}
