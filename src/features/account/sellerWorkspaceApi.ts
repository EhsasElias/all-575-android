import { createHttpClient, createMemoryTokenStore, http } from '@/shared/api';
import { getCurrentLanguage } from '@/shared/i18n';
import { env } from '@/shared/lib';

const tokens = createMemoryTokenStore();
const seller = createHttpClient({ baseUrl: env.apiBaseUrl, tokenStore: tokens, getLanguage: getCurrentLanguage });

export type SellerMembership = {
  id: number; seller_id: number; branch_id: number | null; role: string;
  is_active: boolean; seller_status: string; name_ar: string; name_en: string;
};
export type SellerBranch = {
  id: number; seller_id: number; code: string; name_ar: string; name_en: string; is_active: boolean;
};
export type SellerProduct = {
  id: number; seller_id: number; category_id: number; slug: string;
  name_ar: string; name_en: string; status: string; created_at: string;
};
export type SellerStock = {
  id: number; branch_id: number; variant_id: number; on_hand: number;
  reserved: number; sku: string; name_ar: string; name_en: string;
};
export type SellerOrder = {
  id: string; order_number: string; status: string; branch_id: number;
  placed_at?: string | null; delivery_slot?: string | null;
  items: Array<{ id: number; name: { ar: string; en: string }; quantity: number }>;
};
export type SellerDashboard = {
  awaiting_seller: number; preparing: number; ready: number;
  on_the_way: number; delivered: number; delivered_merchandise_halalas: number; currency: string;
};

export const memberships = () => http.get<{ data: SellerMembership[] }>('/seller/memberships');
export async function openSellerSession() {
  const result = await http.post<{ data: { token: string } }>('/seller/session', { device_name: 'ALL575 seller workspace' });
  await tokens.set(result.data.token);
}
export const closeSellerSession = () => tokens.clear();
export const sellerOrders = (filters: { branch_id?: number; status?: string; limit?: number } = {}) =>
  seller.get<{ data: SellerOrder[] }>('/seller/orders', { params: filters });
export const sellerDashboard = () => seller.get<{ data: SellerDashboard }>('/seller/dashboard');
export const sellerBranches = () => seller.get<{ data: SellerBranch[] }>('/seller/branches');
export const sellerProducts = (filters: { status?: string; limit?: number } = {}) =>
  seller.get<{ data: SellerProduct[] }>('/seller/products', { params: filters });
export const sellerStock = (filters: { branch_id?: number; low_stock_below?: number; limit?: number } = {}) =>
  seller.get<{ data: SellerStock[] }>('/seller/stock', { params: filters });
export const advanceSellerOrder = (id: string, status: 'preparing' | 'ready') =>
  seller.patch('/seller/orders/' + encodeURIComponent(id) + '/status', { status });
export const adjustSellerStock = (id: number, on_hand: number) =>
  seller.patch('/seller/stock/' + id, { on_hand });
