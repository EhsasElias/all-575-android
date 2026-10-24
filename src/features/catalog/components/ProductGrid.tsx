import type { ProductSummary } from '../api/types';
import { ProductCard } from './ProductCard';
import styles from './ProductGrid.module.css';

// One row on a phone is two cards, on a wider screen three.
const EAGER_CARDS = 3;

type ProductGridProps = {
  products: readonly ProductSummary[];
  hideUnknownAvailability?: boolean;
  /** The index of the card that should take the focus when it appears. */
  focusIndex?: number | null;
};

export function ProductGrid({
  products,
  hideUnknownAvailability = false,
  focusIndex = null,
}: ProductGridProps) {
  return (
    <ul className={styles.grid}>
      {products.map((product, index) => (
        <li key={product.id} className={styles.item}>
          <ProductCard
            product={product}
            eager={index < EAGER_CARDS}
            hideUnknownAvailability={hideUnknownAvailability}
            focusOnMount={index === focusIndex}
          />
        </li>
      ))}
    </ul>
  );
}
