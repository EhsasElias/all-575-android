import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/shared/api';

const MAX_RETRIES = 2;

// A 4xx answer will not change on a second try; only transient failures are retried.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && error.status !== null && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}
