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
  name_ar: string; name_en: string; description_ar?: string | null; description_en?: string | null;
  price_halalas: number; vat_class: string; status: string; created_at: string;
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
  seller.get<{ data: SellerOrder[] }>('/seller/orders', { query: filters });
export const sellerDashboard = () => seller.get<{ data: SellerDashboard }>('/seller/dashboard');
export const sellerBranches = () => seller.get<{ data: SellerBranch[] }>('/seller/branches');
export const sellerProducts = (filters: { status?: string; limit?: number } = {}) =>
  seller.get<{ data: SellerProduct[] }>('/seller/products', { query: filters });
export const sellerStock = (filters: { branch_id?: number; low_stock_below?: number; limit?: number } = {}) =>
  seller.get<{ data: SellerStock[] }>('/seller/stock', { query: filters });
export const advanceSellerOrder = (id: string, status: 'preparing' | 'ready') =>
  seller.patch('/seller/orders/' + encodeURIComponent(id) + '/status', { status });
export const adjustSellerStock = (id: number, on_hand: number) =>
  seller.patch('/seller/stock/' + id, { on_hand });

export type SellerProductInput = {
  category_id: number;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  price_halalas: number;
  vat_class: 'standard' | 'zero' | 'exempt';
};

export type SellerCategory = {
  id: number; name_ar: string; name_en: string;
  children?: SellerCategory[];
};

export const sellerCategories = () =>
  http.get<{ data: SellerCategory[] }>('/categories');

export const createSellerProduct = (sellerId: number, input: SellerProductInput) =>
  seller.post<{ data: SellerProduct }>('/seller/products', { ...input, seller_id: sellerId });

export const updateSellerProduct = (productId: number, input: SellerProductInput) =>
  seller.patch<{ data: SellerProduct }>('/seller/products/' + productId, input);

export const addSellerProductVariant = (
  productId: number, variant: { sku: string; barcode?: string | null; name_ar?: string; name_en?: string },
) => seller.post<{ data: { id: number; product_id: number; sku: string; barcode: string | null } }>(
  '/seller/products/' + productId + '/variants', variant,
);

export const submitSellerProduct = (productId: number) =>
  seller.post<{ data: SellerProduct }>('/seller/products/' + productId + '/submit');

export const sellerCatalogTemplate = () =>
  seller.download('/seller/products/import/template.csv');
