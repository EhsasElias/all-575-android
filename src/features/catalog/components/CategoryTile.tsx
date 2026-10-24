import { Link } from 'react-router';
import { useLanguage } from '@/shared/i18n';
import { routeTo } from '@/shared/lib';
import type { Category } from '../api/types';
import { pickText } from '../lib/localized';
import { CatalogImage } from './CatalogImage';
import styles from './CategoryTile.module.css';

const TILE_IMAGE_SIZE = 72;

type CategoryTileProps = {
  category: Category;
  eager?: boolean;
};

/** A round picture over the category name: a link to the category's products. */
export function CategoryTile({ category, eager = false }: CategoryTileProps) {
  const { language } = useLanguage();

  return (
    <Link to={routeTo.categoryProducts(category.slug)} className={styles.tile}>
      <CatalogImage
        src={category.image_url}
        alt=""
        size={TILE_IMAGE_SIZE}
        eager={eager}
        round
        className={styles.image}
      />
      <span className={styles.name}>{pickText(category.name, language)}</span>
    </Link>
  );
}
