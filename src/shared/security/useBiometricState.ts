import { useQuery } from '@tanstack/react-query';
import { sessionVault } from './sessionVault';

export function useBiometricState() {
  const query = useQuery({
    queryKey: ['device-biometry'],
    queryFn: () => sessionVault.state(),
    retry: false,
  });
  return {
    available: query.data?.available ?? false,
    enabled: query.data?.enabled ?? false,
    ready: !query.isPending,
    refresh: query.refetch,
  };
}
