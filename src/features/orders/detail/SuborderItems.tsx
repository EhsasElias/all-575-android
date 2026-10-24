import { useTranslation } from 'react-i18next';
import { formatMoney, formatNumber, useLanguage } from '@/shared/i18n';
import { ItemReview } from '../reviews/ItemReview';
import type { Suborder } from '../types';
import { localized } from './localized';
import styles from './SuborderItems.module.css';

type SuborderItemsProps = {
  orderId: string;
  suborder: Suborder;
};

/** A review belongs to the product, not to a line: two variants of one product share a single review. */
function isFirstLineOfProduct(suborder: Suborder, index: number): boolean {
  const slug = suborder.items[index]?.product_slug;
  return suborder.items.findIndex((item) => item.product_slug === slug) === index;
}

/** The lines of one delivery. Once it is delivered each line also offers a review. */
export function SuborderItems({ orderId, suborder }: SuborderItemsProps) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();

  return (
    <ul className={styles.list}>
      {suborder.items.map((item, index) => {
        const name = localized(item.name, language) ?? item.product_slug;
        const variant = localized(item.variant_name, language);
        return (
          <li key={`${item.product_slug}-${String(index)}`} className={styles.item}>
            <div className={styles.line}>
              {item.image_url !== null && (
                <img src={item.image_url} alt="" loading="lazy" className={styles.image} />
              )}
              <div className={styles.text}>
                <p className={styles.name}>{name}</p>
                {variant !== null && <p className={styles.muted}>{variant}</p>}
                <p className={styles.muted}>
                  {t('items.quantityPrice', {
                    quantity: formatNumber(item.quantity, language),
                    price: formatMoney(item.unit_price, language),
                  })}
                </p>
              </div>
              <p className={styles.total}>{formatMoney(item.line_total, language)}</p>
            </div>
            {suborder.status === 'delivered' && isFirstLineOfProduct(suborder, index) && (
              <ItemReview orderId={orderId} productSlug={item.product_slug} itemName={name} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
