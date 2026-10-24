import { useStoreInfo } from '@/shared/storeInfo';
import type { LegalVersions } from './authApi';

export type ConsentVersions =
  | { status: 'ready'; versions: LegalVersions }
  | { status: 'loading' }
  | { status: 'error'; retry: () => void };

/**
 * The versions the customer is about to accept: the ones the server just asked for, or, when it did not
 * say, the current ones from the store settings.
 */
export function useConsentVersions(fromServer: LegalVersions | null): ConsentVersions {
  const store = useStoreInfo();

  if (fromServer !== null) return { status: 'ready', versions: fromServer };
  if (store.data) {
    return {
      status: 'ready',
      versions: { terms: store.data.terms_version, privacy: store.data.privacy_version },
    };
  }
  if (store.isError) {
    return {
      status: 'error',
      retry: () => {
        void store.refetch();
      },
    };
  }
  return { status: 'loading' };
}
