import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Schemas } from '@/shared/api';
import { useLanguage } from '@/shared/i18n';
import { useToast } from '@/shared/ui';
import { MAX_QUANTITY_PER_LINE } from './cartRules';
import type { LineSnapshot } from './cartTypes';
import { fromApiName, pickText } from './localizedText';
import { useCart } from './useCart';
import { useRefusalMessage } from './useRefusalMessage';

type Product = Schemas['ProductDetailResource'];
type Variant = Schemas['VariantResource'];

/** What happened the last time the customer pressed "Add to cart" for a variant. */
type Outcome = { variantId: number; refusal: string | null };

function snapshotOf(product: Product, variant: Variant): LineSnapshot {
  return {
    variantId: variant.id,
    unitPrice: variant.price.gross,
    productSlug: product.slug,
    name: product.name,
    variantName: fromApiName(variant.name),
    imageUrl: product.image_url,
  };
}

/** The rules of the product page's add button: how much, what to tell the customer, and what the cart did. */
export function useAddToCart(product: Product, variant: Variant) {
  const { t } = useTranslation('cart');
  const { language } = useLanguage();
  const { showToast } = useToast();
  const refusalMessage = useRefusalMessage();
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [last, setLast] = useState<Outcome | null>(null);

  const name = pickText(product.name, language);
  // A result belongs to the variant it was for; choosing another variant starts clean.
  const outcome = last?.variantId === variant.id ? last : null;

  const add = async (): Promise<void> => {
    if (pending) return;
    setPending(true);
    setLast(null);
    const result = await cart.addItem(snapshotOf(product, variant), quantity);
    setPending(false);

    if (!result.ok) {
      setLast({ variantId: variant.id, refusal: refusalMessage(result.reason) });
      return;
    }
    setLast({ variantId: variant.id, refusal: null });
    setQuantity(1);
    showToast(
      result.capped
        ? { message: t('add.capped', { name, max: MAX_QUANTITY_PER_LINE }), variant: 'info' }
        : { message: t('add.added', { name, quantity: result.quantity }), variant: 'success' },
    );
  };

  return {
    name,
    quantity,
    setQuantity,
    pending,
    added: outcome !== null && outcome.refusal === null,
    refusal: outcome?.refusal ?? null,
    add,
  };
}
