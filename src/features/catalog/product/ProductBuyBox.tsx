import { useTranslation } from 'react-i18next';
import { AddToCart } from '@/features/cart';
import { formatMoney, useLanguage } from '@/shared/i18n';
import type { ProductDetail } from '../api/types';
import { AvailabilityBadge } from '../components/AvailabilityBadge';
import { DeliveryChip } from '../delivery/DeliveryChip';
import { useDeliveryZone } from '../delivery/useDeliveryZone';
import { useSelectedVariant } from './useSelectedVariant';
import { VariantPicker } from './VariantPicker';
import styles from './ProductBuyBox.module.css';

/** Price, the choice of variant, availability in the chosen area, and the way to put it in the cart. */
export function ProductBuyBox({ product }: { product: ProductDetail }) {
  const { t } = useTranslation('catalog');
  const { language } = useLanguage();
  const { zoneId } = useDeliveryZone();
  const { selected, select } = useSelectedVariant(product.variants);

  // The server prices every variant the same today, but the shown price always comes from the chosen one.
  const price = selected?.price ?? product.price;
  const availability = selected?.availability ?? product.availability;

  return (
    <div className={styles.box}>
      <p className={styles.priceRow}>
        <span className={styles.price}>{formatMoney(price.gross, language)}</span>
        <span className={styles.vat}>
          {price.vat > 0 ? t('product.vatIncluded') : t('product.vatNone')}
        </span>
      </p>

      {selected && product.variants.length > 1 && (
        <VariantPicker variants={product.variants} selectedId={selected.id} onSelect={select} />
      )}

      <div className={styles.availability}>
        <AvailabilityBadge availability={availability} />
        <DeliveryChip />
        {availability === 'unknown' && zoneId === null && (
          <p className={styles.hint}>{t('availability.chooseArea')}</p>
        )}
      </div>

      {selected && <AddToCart product={product} variant={selected} />}
    </div>
  );
}
