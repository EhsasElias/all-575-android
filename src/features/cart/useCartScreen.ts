import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { useToast } from '@/shared/ui';
import { mayCheckout, payable, toScreenLines } from './cartScreenModel';
import type { CartChange } from './cartTypes';
import { pickText } from './localizedText';
import { useCart } from './useCart';
import { useRefusalMessage } from './useRefusalMessage';
import type { ScreenLine } from './cartScreenModel';

/** Everything the cart screen shows and does, so the components only draw. */
export function useCartScreen() {
  const { t } = useTranslation('cart');
  const { language } = useLanguage();
  const { showToast } = useToast();
  const refusalMessage = useRefusalMessage();
  const cart = useCart();
  // /cart includes availability for each *requested quantity*. A second independent
  // stock query can become stale after quantity edits and mask an out-of-stock response.
  // Variants the server refused as no longer sold. Their lines are flagged instead of disappearing.
  const [gone, setGone] = useState<ReadonlySet<number>>(new Set());

  const lines = useMemo(() => toScreenLines(cart.lines, new Map(), gone), [cart.lines, gone]);
  const buyable = useMemo(() => payable(lines), [lines]);

  const explainRefusal = (change: CartChange, variantId: number): void => {
    if (change.ok) return;
    if (change.reason === 'variant_unavailable') {
      setGone((current) => new Set(current).add(variantId));
    }
    showToast({ message: refusalMessage(change.reason), variant: 'error' });
  };

  const changeQuantity = async (line: ScreenLine, quantity: number): Promise<void> => {
    explainRefusal(await cart.setQuantity(line.variantId, quantity), line.variantId);
  };

  const removeLine = async (line: ScreenLine): Promise<void> => {
    const change = await cart.remove(line.variantId);
    if (change.ok) {
      showToast({ message: t('lines.removed', { name: pickText(line.name, language) }) });
    } else {
      explainRefusal(change, line.variantId);
    }
  };

  return {
    status: cart.status,
    isGuest: cart.kind === 'guest',
    lines,
    buyableItems: buyable.items,
    // Guest checkout first signs in and rechecks via the API. A signed-in cart
    // must have a definitive stock answer before it can continue to payment.
    canCheckout: mayCheckout(lines) && (cart.kind !== 'server' || lines.every((line) => line.availability !== 'unknown')),
    subtotal: buyable.subtotal,
    hasUnavailableLines: lines.some((line) => line.problem !== null),
    changeQuantity,
    removeLine,
    retry: cart.refetch,
  };
}
