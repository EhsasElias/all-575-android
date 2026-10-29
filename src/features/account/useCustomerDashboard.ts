import { useQuery } from '@tanstack/react-query';
import { http, type Data, type Schemas } from '@/shared/api';
import { useSession } from '@/shared/session';

export type CustomerDashboard = Schemas['CustomerDashboardResource'];

export function useCustomerDashboard() {
  const { user, status } = useSession();
  return useQuery({
    queryKey: ['customer-dashboard', user?.id],
    enabled: status === 'signed-in' && user !== null,
    queryFn: async ({ signal }) =>
      (await http.get<Data<CustomerDashboard>>('/me/dashboard', { signal })).data,
    staleTime: 0,
    refetchInterval: 30_000,
    retry: 1,
  });
}
