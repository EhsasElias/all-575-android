import { useInfiniteQuery } from '@tanstack/react-query';
import { http, isApiError, type Page } from '@/shared/api';
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

/** Treat remotely returned pagination as untrusted at runtime, despite its TS contract. */
function nextLink(page: unknown): string | null {
  if (typeof page !== 'object' || page === null || !('links' in page)) return null;
  const links = page.links;
  if (typeof links !== 'object' || links === null || !('next' in links)) return null;
  return typeof links.next === 'string' ? links.next : null;
}

/** Missing pagination metadata must never crash the whole storefront. */
function nextLink(page: object): string | null {
  const rawLinks: unknown = Reflect.get(page, 'links');
  if (typeof rawLinks !== 'object' || rawLinks === null || !('next' in rawLinks)) {
    return null;
  }
  return typeof rawLinks.next === 'string' ? rawLinks.next : null;
}

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
    // A rejected 4xx request is deterministic; do not silently retry and hide the error state.
    retry: (count, cause) =>
      count < 2 && !(isApiError(cause) && cause.status !== null && cause.status >= 400 && cause.status < 500),
    initialPageParam: FIRST_PAGE,
    queryFn: ({ pageParam, signal }) =>
      http.get<Page<T>>(path, { query: { ...query, ...pageParam }, signal }),
    getNextPageParam: (lastPage) => nextPageQuery(nextLink(lastPage)),
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
