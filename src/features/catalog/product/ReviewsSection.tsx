import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, Skeleton, VisuallyHidden } from '@/shared/ui';
import { useReviews } from '../api/useCatalogQueries';
import { LoadMore } from '../components/LoadMore';
import { useFocusNewItems } from '../components/useFocusNewItems';
import { ReviewItem } from './ReviewItem';
import styles from './ReviewsSection.module.css';

const PLACEHOLDERS = [1, 2] as const;

export function ReviewsSection({ slug }: { slug: string }) {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation();
  const reviews = useReviews(slug);
  const { focusIndex, onLoadMore } = useFocusNewItems(reviews.items.length, reviews.loadMore);

  return (
    <section aria-labelledby="product-reviews" className={styles.section}>
      <h2 id="product-reviews" className={styles.title}>
        {t('reviews.title')}
      </h2>

      {reviews.status === 'loading' && (
        <div role="status" className={styles.skeleton}>
          <VisuallyHidden>{tCommon('states.loading')}</VisuallyHidden>
          {PLACEHOLDERS.map((placeholder) => (
            <div key={placeholder} aria-hidden="true" className={styles.skeletonRow}>
              <Skeleton width="40%" height="1.2em" />
              <Skeleton height="1em" />
            </div>
          ))}
        </div>
      )}
      {reviews.status === 'error' && (
        <ErrorState headingLevel={3} title={t('reviews.errorTitle')} onRetry={reviews.retry} />
      )}
      {reviews.status === 'ready' && reviews.items.length === 0 && (
        <EmptyState
          icon="star"
          headingLevel={3}
          title={t('reviews.emptyTitle')}
          message={t('reviews.emptyMessage')}
        />
      )}
      {reviews.status === 'ready' && reviews.items.length > 0 && (
        <>
          <ul className={styles.list}>
            {reviews.items.map((review, index) => (
              <li key={review.id}>
                <ReviewItem review={review} focusOnMount={index === focusIndex} />
              </li>
            ))}
          </ul>
          <LoadMore
            hasNextPage={reviews.hasNextPage}
            isFetchingNextPage={reviews.isFetchingNextPage}
            failed={reviews.loadMoreFailed}
            onLoadMore={onLoadMore}
          />
        </>
      )}
    </section>
  );
}
