import { http, type Data } from '@/shared/api';
import type { paths } from '@/shared/api/schema';
export type BillingProfile =
  paths['/v1/me/billing-profile']['get']['responses']['200']['content']['application/json']['data'];
export const billingKey = ['customer', 'billing-profile'];
export async function getBilling(signal: AbortSignal) {
  return (await http.get<Data<BillingProfile>>('/me/billing-profile', { signal })).data;
}
export async function putBilling(profile: BillingProfile) {
  return (await http.put<Data<BillingProfile>>('/me/billing-profile', profile)).data;
}
