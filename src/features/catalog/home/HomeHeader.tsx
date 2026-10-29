import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { routePaths } from '@/shared/lib';
import { useStoreInfo } from '@/shared/storeInfo';
import { Icon, Skeleton } from '@/shared/ui';
import { DeliveryChip } from '../delivery/DeliveryChip';
import { HeroProducts } from './HeroProducts';
import styles from './HomeHeader.module.css';

/** Search first, then a calm photographic introduction to the store. */
export function HomeHeader() {
  const { t } = useTranslation('catalog');
  const { language } = useLanguage();
  const store = useStoreInfo();

  return (
    <div className={styles.header}>
      <DeliveryChip className={styles.chip} />
      <Link to={routePaths.search} className={styles.search}>
        <Icon name="search" />
        {t('search.label')}
      </Link>
      <div className={styles.hero}>
        <div className={styles.copy}>
          <h1 className={styles.title}>{t('home.heading')}</h1>
          <div className={styles.promise}>
            {store.data ? (
              <p className={styles.price}>
                {t('home.priceLine', { price: formatMoney(store.data.price.gross, language) })}
              </p>
            ) : (
              store.isPending && <Skeleton width="100%" height="2rem" />
            )}
          </div>
        </div>
        <HeroProducts />
      </div>
    </div>
  );
}
