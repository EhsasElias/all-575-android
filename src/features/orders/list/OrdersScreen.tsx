import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState, ErrorState } from '@/shared/ui';
import { OrdersList } from './OrdersList';
import { OrdersSkeleton } from './OrdersSkeleton';
import { useOrderList } from './useOrderList';
import styles from './OrdersScreen.module.css';

function OrdersContent() {
  const { t } = useTranslation('orders');
  const { t: tCommon } = useTranslation('common');
  const list = useOrderList();

  if (list.isPending) return <OrdersSkeleton />;

  if (list.data === undefined) {
    return (
      <ErrorState
        onRetry={() => void list.refetch()}
        title={t('list.errorTitle')}
        message={t('list.errorMessage')}
      />
    );
  }

  if (list.data.length === 0) {
    return (
      <EmptyState
        icon="receipt"
        title={t('list.emptyTitle')}
        message={t('list.emptyMessage')}
        action={<ButtonLink to={routePaths.home}>{tCommon('actions.startShopping')}</ButtonLink>}
      />
    );
  }

  return (
    <OrdersList
      orders={list.data}
      hasMore={list.hasNextPage}
      loadingMore={list.isFetchingNextPage}
      loadMoreFailed={list.isFetchNextPageError}
      onLoadMore={() => void list.fetchNextPage()}
    />
  );
}

/** `/orders`: every order of the signed-in customer, newest first. */
export function OrdersScreen() {
  const { t } = useTranslation('orders');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('list.title')}</h1>
        <ButtonLink to={routePaths.spending} variant="ghost">
          {t('list.spending')}
        </ButtonLink>
      </header>
      <OrdersContent />
    </div>
  );
}
