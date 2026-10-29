import { useTranslation } from 'react-i18next';
import { useSession } from '@/shared/session';
import { ButtonLink, EmptyState } from '@/shared/ui';
import { routePaths } from '@/shared/lib';
import type { ProductSummary } from '../api/types';
import { usePagedQuery } from '../api/usePagedQuery';
import { ProductResults } from '../components/ProductResults';
import styles from '../search/SearchScreen.module.css';
export function SavedProductsScreen() {
  const { t } = useTranslation('catalog');
  const { status } = useSession();
  const list = usePagedQuery<ProductSummary>({
    queryKey: ['customer', 'saved-products'],
    path: '/me/saved-products',
    query: {},
    enabled: status === 'signed-in',
  });
  return (
    <div className={styles.screen}>
      <h1>{t('saved.title')}</h1>
      {status !== 'signed-in' ? (
        <EmptyState
          icon="user"
          title={t('saved.signIn')}
          message={t('saved.signInHint')}
          action={
            <ButtonLink
              to={`${routePaths.signIn}?next=${encodeURIComponent(routePaths.savedProducts)}`}
            >
              {t('saved.signIn')}
            </ButtonLink>
          }
        />
      ) : (
        <ProductResults
          list={list}
          hideUnknownAvailability
          empty={
            <EmptyState
              icon="cart"
              title={t('saved.empty')}
              message={t('saved.emptyHint')}
              action={<ButtonLink to={routePaths.categories}>{t('saved.browse')}</ButtonLink>}
            />
          }
        />
      )}
    </div>
  );
}
