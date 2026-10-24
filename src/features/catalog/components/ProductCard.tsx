import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { routeTo } from '@/shared/lib';
import type { ProductSummary } from '../api/types';
import { pickText } from '../lib/localized';
import { AvailabilityBadge } from './AvailabilityBadge';
import { CatalogImage } from './CatalogImage';
import { RatingSummary } from './StarRating';
import styles from './ProductCard.module.css';

const CARD_IMAGE_SIZE = 320;

type ProductCardProps = {
  product: ProductSummary;
  /** Cards in the first row are on screen at first paint, so their pictures must not wait. */
  eager?: boolean;
  /** Before the customer chooses an area every product is "unknown"; saying so on each card is noise. */
  hideUnknownAvailability?: boolean;
  /** Takes the keyboard focus when it appears: the first card of a page the customer asked for. */
  focusOnMount?: boolean;
};

export function ProductCard({
  product,
  eager = false,
  hideUnknownAvailability = false,
  focusOnMount = false,
}: ProductCardProps) {
  const { language } = useLanguage();
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (focusOnMount) linkRef.current?.focus();
  }, [focusOnMount]);

  const showAvailability = !(hideUnknownAvailability && product.availability === 'unknown');

  return (
    <article className={styles.card}>
      <CatalogImage
        src={product.image_url}
        alt=""
        size={CARD_IMAGE_SIZE}
        eager={eager}
        className={styles.image}
      />
      <div className={styles.body}>
        <p className={styles.name}>
          <Link ref={linkRef} to={routeTo.product(product.slug)} className={styles.link}>
            {pickText(product.name, language)}
          </Link>
        </p>
        <p className={styles.seller}>{pickText(product.seller.name, language)}</p>
        <RatingSummary average={product.rating.average} count={product.rating.count} compact />
        <p className={styles.price}>{formatMoney(product.price.gross, language)}</p>
        {showAvailability && <AvailabilityBadge availability={product.availability} />}
      </div>
    </article>
  );
}
