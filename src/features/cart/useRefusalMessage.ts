import { useTranslation } from 'react-i18next';
import { MAX_QUANTITY_PER_LINE } from './cartRules';
import type { CartRefusal } from './cartTypes';

/** The sentence that tells the customer why a cart change did not happen and what to do. */
export function useRefusalMessage(): (reason: CartRefusal) => string {
  const { t } = useTranslation('cart');
  return (reason) => t(`refusal.${reason}`, { max: MAX_QUANTITY_PER_LINE });
}
