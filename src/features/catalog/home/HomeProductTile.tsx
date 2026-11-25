import { useState } from 'react';
import { Link } from 'react-router';
import { useCart } from '@/features/cart/useCart';
import { useRefusalMessage } from '@/features/cart/useRefusalMessage';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { routeTo } from '@/shared/lib';
import { useToast } from '@/shared/ui';
import type { ProductSummary } from '../api/types';
import { CatalogImage } from '../components/CatalogImage';
import { pickText } from '../lib/localized';
import styles from './HomeDiscovery.module.css';

type Props = { product: ProductSummary };

/** The same product tile serves grocery and personalized discovery shelves. */
export function HomeProductTile({ product }: Props) {
  const cart = useCart();
  const { language } = useLanguage();
  const { showToast } = useToast();
  const refusalMessage = useRefusalMessage();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tr = (ar: string, en: string, fr: string) =>
    language === 'ar' ? ar : language === 'fr' ? fr : en;
  const name = pickText(product.name, language);
  const branch = product.stock_branch ? pickText(product.stock_branch, language) : null;
  const canAdd = product.availability !== 'out_of_stock' && product.availability !== 'unknown'
    && product.purchase_variant_id != null;

  const add = async (): Promise<void> => {
    if (pending || !canAdd || product.purchase_variant_id == null) return;
    setPending(true);
    setError(null);
    try {
      const result = await cart.addItem({
        variantId: product.purchase_variant_id,
        productSlug: product.slug,
        name: product.name,
        variantName: null,
        imageUrl: product.image_url,
        unitPrice: product.price.net,
      }, 1);
      if (result.ok) {
        showToast({ message: tr('تمت الإضافة إلى السلة', 'Added to cart', 'Ajouté au panier'), variant: 'success' });
      } else {
        setError(refusalMessage(result.reason));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <article className={styles.productCard}>
      <Link className={styles.productMainLink} to={routeTo.product(product.slug)}>
        <span className={styles.productImage}>
          <CatalogImage src={product.image_url} alt="" size={180} />
        </span>
        <span className={styles.productName}>{name}</span>
      </Link>
      <div className={styles.storeMeta}>
        <span className={styles.storeMetaLabel}>{tr('الشركة', 'Store', 'Boutique')}</span>
        <span className={styles.storeMetaValue}>{pickText(product.seller.name, language)}</span>
        {branch && (
          <>
            <span className={styles.storeMetaLabel}>{tr('الفرع', 'Branch', 'Agence')}</span>
            <span className={styles.storeMetaValue}>{branch}</span>
          </>
        )}
      </div>
      <span className={styles.productPrice}>{formatMoney(product.price.net, language)}</span>
      {product.availability !== 'unknown' && (
        <span className={product.availability === 'out_of_stock' ? styles.unavailable : styles.available}>
          {product.availability === 'out_of_stock'
            ? tr('غير متوفر', 'Out of stock', 'Rupture de stock')
            : product.availability === 'low_stock'
              ? tr('كمية محدودة', 'Limited stock', 'Stock limité')
              : tr('متوفر', 'In stock', 'En stock')}
        </span>
      )}
      {canAdd ? (
        <button className={styles.addButton} type="button" disabled={pending} onClick={() => void add()}>
          {pending
            ? tr('جار الإضافة…', 'Adding…', 'Ajout…')
            : tr('+ أضف للسلة', '+ Add to cart', '+ Ajouter')}
        </button>
      ) : product.availability === 'out_of_stock' ? (
        <button className={styles.addButton} type="button" disabled>
          {tr('غير متوفر', 'Unavailable', 'Indisponible')}
        </button>
      ) : (
        <Link className={styles.addLink} to={routeTo.product(product.slug)}>
          {tr('عرض المنتج', 'View product', 'Voir le produit')}
        </Link>
      )}
      {error && <p className={styles.cardError} role="alert">{error}</p>}
    </article>
  );
}
