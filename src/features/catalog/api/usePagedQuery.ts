import { useInfiniteQuery } from '@tanstack/react-query';
import { http, type Page } from '@/shared/api';
import { nextPageQuery, type CursorQuery } from './pagination';

type PagedQueryOptions = {
  queryKey: readonly unknown[];
  path: string;
  query?: Record<string, string | number | undefined>;
  enabled?: boolean;
};

export type PagedList<T> = {
  status: 'loading' | 'error' | 'ready';
  items: T[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** The first page is on screen but the next one failed: show a retry beside the list, keep the list. */
  loadMoreFailed: boolean;
  loadMore: () => void;
  retry: () => void;
};

const FIRST_PAGE: CursorQuery | null = null;

/** A cursor-paginated list. The next page is requested with the query string of `links.next`, as is. */
export function usePagedQuery<T>({
  queryKey,
  path,
  query = {},
  enabled = true,
}: PagedQueryOptions): PagedList<T> {
  const result = useInfiniteQuery({
    queryKey,
    enabled,
    initialPageParam: FIRST_PAGE,
    queryFn: ({ pageParam, signal }) =>
      http.get<Page<T>>(path, { query: { ...query, ...pageParam }, signal }),
    getNextPageParam: (lastPage) => nextPageQuery(lastPage.links.next),
  });

  const hasPages = result.data !== undefined;
  const status = result.isPending ? 'loading' : result.isError && !hasPages ? 'error' : 'ready';

  return {
    status,
    items: result.data?.pages.flatMap((page) => page.data) ?? [],
    hasNextPage: result.hasNextPage,
    isFetchingNextPage: result.isFetchingNextPage,
    loadMoreFailed: result.isFetchNextPageError,
    loadMore: () => {
      void result.fetchNextPage();
    },
    retry: () => {
      void result.refetch();
    },
  };
}
