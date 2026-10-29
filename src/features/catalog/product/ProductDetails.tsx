import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useLanguage } from '@/shared/i18n';
import { routeTo } from '@/shared/lib';
import { Icon } from '@/shared/ui';
import type { ProductDetail } from '../api/types';
import { CatalogImage } from '../components/CatalogImage';
import { RatingSummary } from '../components/StarRating';
import { pickText } from '../lib/localized';
import { SaveProduct } from '../saved/SaveProduct';
import { ProductBuyBox } from './ProductBuyBox';
import { ReviewsSection } from './ReviewsSection';
import styles from './ProductDetails.module.css';

const MAIN_IMAGE_SIZE = 640;

export function ProductDetails({ product }: { product: ProductDetail }) {
  const { t } = useTranslation('catalog');
  const { language } = useLanguage();
  const name = pickText(product.name, language);
  const description = pickText(product.description, language);

  return (
    <div className={styles.screen}>
      <CatalogImage src={product.image_url} alt={name} size={MAIN_IMAGE_SIZE} eager />

      <div className={styles.heading}>
        <p className={styles.meta}>
          {t('product.category')}:{' '}
          <Link to={routeTo.categoryProducts(product.category.slug)}>
            {pickText(product.category.name, language)}
          </Link>
        </p>
        <h1 className={styles.title}>{name}</h1>
        <p className={styles.meta}>
          {t('product.soldBy')}:{' '}
          <Link to={routeTo.seller(product.seller.slug)}>
            {pickText(product.seller.name, language)}
          </Link>
        </p>
        <RatingSummary average={product.rating.average} count={product.rating.count} />
      </div>

      <ProductBuyBox product={product} />
      <SaveProduct slug={product.slug} />

      {description !== '' && (
        <details className={styles.about}>
          <summary className={styles.summary}>
            <h2 className={styles.sectionTitle}>{t('product.aboutTitle')}</h2>
            <Icon name="chevron-down" size={18} />
          </summary>
          {/* Plain text only, keeping the seller's line breaks. */}
          <p className={styles.description}>{description}</p>
        </details>
      )}

      <ReviewsSection slug={product.slug} />
    </div>
  );
}
