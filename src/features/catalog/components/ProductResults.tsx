import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '@/shared/ui';
import type { ProductSummary } from '../api/types';
import type { PagedList } from '../api/usePagedQuery';
import { LoadMore } from './LoadMore';
import { ProductGrid } from './ProductGrid';
import { ProductGridSkeleton } from './ProductGridSkeleton';
import { useFocusNewItems } from './useFocusNewItems';

type ProductResultsProps = {
  list: PagedList<ProductSummary>;
  /** What to show when the list is empty: say why and offer a next step. */
  empty: ReactNode;
  hideUnknownAvailability: boolean;
};

/** A paged grid of products with its loading, error and empty states. */
export function ProductResults({ list, empty, hideUnknownAvailability }: ProductResultsProps) {
  const { t } = useTranslation('catalog');
  const { focusIndex, onLoadMore } = useFocusNewItems(list.items.length, list.loadMore);

  if (list.status === 'loading') return <ProductGridSkeleton />;
  if (list.status === 'error') {
    return <ErrorState title={t('list.productsErrorTitle')} onRetry={list.retry} />;
  }
  if (list.items.length === 0) return empty;

  return (
    <>
      <ProductGrid
        products={list.items}
        hideUnknownAvailability={hideUnknownAvailability}
        focusIndex={focusIndex}
      />
      <LoadMore
        hasNextPage={list.hasNextPage}
        isFetchingNextPage={list.isFetchingNextPage}
        failed={list.loadMoreFailed}
        onLoadMore={onLoadMore}
      />
    </>
  );
}
