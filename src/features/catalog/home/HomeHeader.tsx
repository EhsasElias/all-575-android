import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { routePaths } from '@/shared/lib';
import { useStoreInfo } from '@/shared/storeInfo';
import { Icon, Skeleton } from '@/shared/ui';
import { DeliveryChip } from '../delivery/DeliveryChip';
import styles from './HomeHeader.module.css';

/** Where the customer is delivered to, what everything costs and the way into search. */
export function HomeHeader() {
  const { t } = useTranslation('catalog');
  const { language } = useLanguage();
  const store = useStoreInfo();

  return (
    <div className={styles.header}>
      <DeliveryChip className={styles.chip} />
      <h1 className={styles.title}>{t('home.heading')}</h1>
      <div className={styles.promise}>
        {store.data ? (
          <p className={styles.price}>
            <Icon name="tag" size={18} />
            {t('home.priceLine', { price: formatMoney(store.data.price.gross, language) })}
          </p>
        ) : (
          store.isPending && <Skeleton width="14rem" height="2rem" />
        )}
      </div>
      <Link to={routePaths.search} className={styles.search}>
        <Icon name="search" />
        {t('search.label')}
      </Link>
    </div>
  );
}
