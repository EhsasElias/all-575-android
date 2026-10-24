import { useState } from 'react';
import type { LoadMoreSource } from './LoadMore';

/**
 * After the customer presses "Load more", focus should land on the first new item, so keyboard and screen-reader
 * users carry on where the new content begins instead of at the top of the page. Pages that load by scrolling
 * never move focus.
 */
export function useFocusNewItems(loadedCount: number, loadMore: () => void) {
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  return {
    focusIndex,
    onLoadMore: (source: LoadMoreSource) => {
      if (source === 'button') setFocusIndex(loadedCount);
      loadMore();
    },
  };
}
