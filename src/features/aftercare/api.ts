import { http, type Data, type Page, type Schemas } from '@/shared/api';
import type { operations } from '@/shared/api/schema';

export type CustomerCase = Schemas['CustomerCaseResource'];
export type CareItems =
  operations['customerCase.items']['responses'][200]['content']['application/json']['data']['items'];
export type CaseInput = Schemas['CreateCustomerCaseRequest'];
const segment = (id: string) => encodeURIComponent(id);

export async function fetchCases(cursor: string | null, signal: AbortSignal) {
  return http.get<Page<CustomerCase>>('/me/cases', {
    query: { cursor: cursor ?? undefined },
    signal,
  });
}
export async function fetchCase(id: string, signal: AbortSignal) {
  const { data } = await http.get<Data<CustomerCase>>(`/me/cases/${segment(id)}`, { signal });
  return data;
}
export async function fetchCareItems(orderId: string, signal: AbortSignal) {
  const { data } = await http.get<Data<{ items: CareItems }>>(
    `/orders/${segment(orderId)}/care-items`,
    { signal },
  );
  return data.items;
}
export async function createCase(orderId: string, input: CaseInput) {
  const { data } = await http.post<Data<CustomerCase>>(`/orders/${segment(orderId)}/cases`, input);
  return data;
}
export async function sendMessage(id: string, message: string) {
  const { data } = await http.post<Data<CustomerCase>>(`/me/cases/${segment(id)}/messages`, {
    message,
  });
  return data;
}
