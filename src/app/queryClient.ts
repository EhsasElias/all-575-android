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

// By default a request is held back for ever while the browser believes the device is offline, which a phone on a
// Wi-Fi without internet, or switching networks, can believe wrongly: the customer then sees a loading screen that
// never ends. Always try: a failure shows an error with a way to retry.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      mutations: { networkMode: 'always' },
      queries: {
        networkMode: 'always',
        retry: shouldRetry,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}
