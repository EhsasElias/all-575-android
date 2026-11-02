import { createHttpClient, createMemoryTokenStore, http } from '@/shared/api';
import { getCurrentLanguage } from '@/shared/i18n';
import { env } from '@/shared/lib';

const tokens = createMemoryTokenStore();
const seller = createHttpClient({ baseUrl: env.apiBaseUrl, tokenStore: tokens, getLanguage: getCurrentLanguage });
export const memberships = () => http.get<{ data: Array<{ id: number; role: string; is_active: boolean; seller_status: string; name_ar: string; name_en: string }> }>('/seller/memberships');
export async function openSellerSession() {
  const result = await http.post<{ data: { token: string } }>('/seller/session', { device_name: 'ALL575 seller workspace' });
  await tokens.set(result.data.token);
}
export const closeSellerSession = () => tokens.clear();
export type SellerOrder = { id: string; order_number: string; status: string; branch_id: number; items: Array<{ id: number; name: { ar: string; en: string }; quantity: number }> };
export const sellerOrders = () => seller.get<{ data: SellerOrder[] }>('/seller/orders');
export const sellerDashboard = () => seller.get<{ data: Record<string, number> }>('/seller/dashboard');
export const sellerBranches = () => seller.get<{ data: Array<{ id: number; name_ar: string; name_en: string }> }>('/seller/branches');
export const advanceSellerOrder = (id: string, status: 'preparing' | 'ready') => seller.patch('/seller/orders/' + encodeURIComponent(id) + '/status', { status });
