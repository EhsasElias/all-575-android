import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { useToast } from '@/shared/ui';
import { payable, toScreenLines } from './cartScreenModel';
import type { CartChange } from './cartTypes';
import { pickText } from './localizedText';
import { useCart } from './useCart';
import { useLineAvailability } from './useLineAvailability';
import { useRefusalMessage } from './useRefusalMessage';
import type { ScreenLine } from './cartScreenModel';

/** Everything the cart screen shows and does, so the components only draw. */
export function useCartScreen() {
  const { t } = useTranslation('cart');
  const { language } = useLanguage();
  const { showToast } = useToast();
  const refusalMessage = useRefusalMessage();
  const cart = useCart();
  const stock = useLineAvailability(cart.kind === 'server' && cart.status === 'ready');
  // Variants the server refused as no longer sold. Their lines are flagged instead of disappearing.
  const [gone, setGone] = useState<ReadonlySet<number>>(new Set());

  const lines = useMemo(() => toScreenLines(cart.lines, stock, gone), [cart.lines, stock, gone]);
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
    subtotal: buyable.subtotal,
    hasUnavailableLines: lines.some((line) => line.problem !== null),
    changeQuantity,
    removeLine,
    retry: cart.refetch,
  };
}
