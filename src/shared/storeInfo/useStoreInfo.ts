import { useQuery } from '@tanstack/react-query';
import { http, type Data } from '@/shared/api';
import type { paths } from '@/shared/api/schema';

type StoreResponse = paths['/v1/store']['get']['responses']['200']['content']['application/json'];

/** The platform constants the server owns: the one price, the VAT rate and the current legal versions. */
export type StoreInfo = StoreResponse['data'];

const ONE_HOUR_MS = 60 * 60 * 1000;

export function useStoreInfo() {
  return useQuery({
    queryKey: ['store-info'],
    queryFn: async (): Promise<StoreInfo> => (await http.get<Data<StoreInfo>>('/store')).data,
    staleTime: ONE_HOUR_MS,
  });
}
