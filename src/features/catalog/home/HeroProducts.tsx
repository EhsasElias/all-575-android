import { useFirstProducts } from '../api/useProductList';
import { CatalogImage } from '../components/CatalogImage';
import { useDeliveryZone } from '../delivery/useDeliveryZone';
import styles from './HomeHeader.module.css';

/** Reuse the home shelf query so the introduction shows actual catalog photographs. */
export function HeroProducts() {
  const { zoneId } = useDeliveryZone();
  const products = useFirstProducts({ zoneId, perPage: 12 });
  const photos = products.data?.filter((product) => product.image_url !== null).slice(0, 2);
  if (!photos?.length) return null;

  return (
    <div className={styles.art} aria-hidden="true">
      {photos.map((product) => (
        <CatalogImage
          key={product.id}
          src={product.image_url}
          alt=""
          size={240}
          eager
          className={styles.productImage}
        />
      ))}
    </div>
  );
}
