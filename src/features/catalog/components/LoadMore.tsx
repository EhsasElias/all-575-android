import { useEffect, useEffectEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, VisuallyHidden } from '@/shared/ui';
import styles from './LoadMore.module.css';

// Start loading a little before the end of the list comes into view.
const PRELOAD_DISTANCE = '300px';

/** `button` when the customer asked, `scroll` when the end of the list came into view by itself. */
export type LoadMoreSource = 'button' | 'scroll';

type LoadMoreProps = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  failed: boolean;
  onLoadMore: (source: LoadMoreSource) => void;
};

/**
 * The end of a paged list. A visible button always works; where the browser can tell when the end scrolls into
 * view, the next page also loads by itself. A failed page is never retried automatically, so a broken
 * connection cannot cause a request loop.
 */
export function LoadMore({ hasNextPage, isFetchingNextPage, failed, onLoadMore }: LoadMoreProps) {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMore = useEffectEvent(onLoadMore);
  const canAutoLoad = hasNextPage && !isFetchingNextPage && !failed;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!canAutoLoad || !sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore('scroll');
      },
      { rootMargin: PRELOAD_DISTANCE },
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [canAutoLoad]);

  return (
    <div className={styles.root}>
      <VisuallyHidden role="status">
        {isFetchingNextPage ? t('list.loadingMore') : ''}
      </VisuallyHidden>
      {failed && (
        <p role="alert" className={styles.failure}>
          {t('list.loadMoreFailed')}
        </p>
      )}
      {hasNextPage && (
        <Button
          variant="secondary"
          loading={isFetchingNextPage}
          onClick={() => {
            onLoadMore('button');
          }}
        >
          {failed ? tCommon('actions.retry') : t('list.loadMore')}
        </Button>
      )}
      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  );
}
