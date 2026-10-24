import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import type { OrderSummary } from '../types';
import { OrderCard } from './OrderCard';
import styles from './OrdersList.module.css';

type OrdersListProps = {
  orders: OrderSummary[];
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreFailed: boolean;
  onLoadMore: () => void;
};

/** The loaded orders and a "Load more" button that keeps the keyboard where the new orders start. */
export function OrdersList({
  orders,
  hasMore,
  loadingMore,
  loadMoreFailed,
  onLoadMore,
}: OrdersListProps) {
  const { t } = useTranslation('orders');
  const listRef = useRef<HTMLUListElement>(null);
  const focusIndex = useRef<number | null>(null);

  // The button disappears after the last page, so focus moves to the first new order instead of getting lost.
  useEffect(() => {
    const index = focusIndex.current;
    if (index === null || orders.length <= index) return;
    focusIndex.current = null;
    listRef.current?.querySelectorAll<HTMLAnchorElement>('h2 a')[index]?.focus();
  }, [orders.length]);

  const handleLoadMore = () => {
    focusIndex.current = orders.length;
    onLoadMore();
  };

  return (
    <>
      <ul ref={listRef} className={styles.list}>
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </ul>
      {hasMore && (
        <div className={styles.more}>
          {loadMoreFailed && (
            <p role="alert" className={styles.error}>
              {t('list.loadMoreFailed')}
            </p>
          )}
          <Button variant="secondary" loading={loadingMore} onClick={handleLoadMore}>
            {loadMoreFailed ? t('list.loadMoreRetry') : t('list.loadMore')}
          </Button>
        </div>
      )}
    </>
  );
}
