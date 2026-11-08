import { createHttpClient, createMemoryTokenStore, http } from '@/shared/api';
import { getCurrentLanguage } from '@/shared/i18n';
import { env } from '@/shared/lib';

const tokens = createMemoryTokenStore();
export const seller = createHttpClient({
  baseUrl: env.apiBaseUrl,
  tokenStore: tokens,
  getLanguage: getCurrentLanguage,
});

export type SellerMembership = {
  id: number;
  seller_id: number;
  branch_id: number | null;
  role: string;
  is_active: boolean;
  seller_status: string;
  name_ar: string;
  name_en: string;
};
export type SellerBranch = {
  id: number;
  seller_id: number;
  code: string;
  name_ar: string;
  name_en: string;
  is_active: boolean;
  lat: number;
  lng: number;
  service_zone_id: number;
  service_zone_ids?: number[];
};
export type SellerProduct = {
  id: number;
  seller_id: number;
  category_id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar?: string | null;
  description_en?: string | null;
  image_path?: string | null;
  sku?: string | null;
  price_halalas: number;
  vat_class: string;
  vat_justification?: string | null;
  status: string;
  created_at: string;
  rejection_reason?: string | null;
};
export type SellerStock = {
  id: number;
  branch_id: number;
  variant_id: number;
  on_hand: number;
  reserved: number;
  sku: string;
  name_ar: string;
  name_en: string;
};
export type SellerOrder = {
  id: string;
  order_number: string;
  status: string;
  branch_id: number;
  placed_at?: string | null;
  delivery_slot?: string | null;
  items: Array<{ id: number; name: { ar: string; en: string }; quantity: number }>;
};
export type SellerDashboard = {
  awaiting_seller: number;
  preparing: number;
  ready: number;
  on_the_way: number;
  delivered: number;
  delivered_merchandise_halalas: number;
  currency: string;
};

export const memberships = () => http.get<{ data: SellerMembership[] }>('/seller/memberships');
export async function openSellerSession() {
  const result = await http.post<{ data: { token: string } }>('/seller/session', {
    device_name: 'ALL575 seller workspace',
  });
  await tokens.set(result.data.token);
}
export const closeSellerSession = () => tokens.clear();
export const sellerOrders = (
  filters: {
    branch_id?: number;
    status?: string;
    limit?: number;
    from?: string;
    to?: string;
    before_id?: string;
  } = {},
) => seller.get<{ data: SellerOrder[] }>('/seller/orders', { query: filters });
export const sellerDashboard = () => seller.get<{ data: SellerDashboard }>('/seller/dashboard');

export type SellerInsightMetric =
  | 'orders' | 'awaiting_seller' | 'preparing' | 'ready' | 'on_the_way'
  | 'delivered' | 'sales' | 'products' | 'branches' | 'stock';
export type SellerInsightFilters = {
  metric: SellerInsightMetric;
  from: string;
  to: string;
  branch_id?: number;
};
export type SellerInsightDetails = {
  metric: SellerInsightMetric;
  from: string;
  to: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  returned_rows: number;
  max_rows: number;
  note: string;
};
export type SellerDailyTrend = {
  day: string;
  orders: number;
  merchandise_halalas: number;
};
export const sellerInsightTrend = (filters: SellerInsightFilters) =>
  seller.get<{ data: SellerDailyTrend[]; note: string }>('/seller/insights/trend', { query: filters });
export const sellerInsightDetails = (filters: SellerInsightFilters) =>
  seller.get<{ data: SellerInsightDetails }>('/seller/insights', { query: filters });
export const exportSellerInsight = (filters: SellerInsightFilters, format: 'csv' | 'xlsx') =>
  seller.download('/seller/insights/export/' + format, {
    query: { ...filters, lang: getCurrentLanguage() },
  });

export const sellerBranches = () => seller.get<{ data: SellerBranch[] }>('/seller/branches');
export const sellerProducts = (
  filters: { status?: string; q?: string; limit?: number; before_id?: number } = {},
) => seller.get<{ data: SellerProduct[] }>('/seller/products', { query: filters });
export const sellerStock = (
  filters: {
    branch_id?: number;
    low_stock_below?: number;
    q?: string;
    limit?: number;
    before_id?: number;
  } = {},
) => seller.get<{ data: SellerStock[] }>('/seller/stock', { query: filters });
export const advanceSellerOrder = (id: string, status: 'preparing' | 'ready') =>
  seller.patch('/seller/orders/' + encodeURIComponent(id) + '/status', { status });
export const createSellerStock = (input: { branch_id: number; sku: string; on_hand: number }) =>
  seller.post<{ data: { id: number; branch_id: number; variant_id: number; on_hand: number; reserved: number } }>(
    '/seller/stock',
    input,
  );

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
  vat_justification?: string | null;
};

export type SellerCategory = {
  id: number;
  name: { ar: string; en: string };
  children?: SellerCategory[];
};

export const sellerCategories = () => http.get<{ data: SellerCategory[] }>('/categories');

export type SellerCategoryRequest = {
  id: number;
  seller_id: number;
  parent_id: number | null;
  name_ar: string;
  name_en: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  review_note: string | null;
};
export const sellerCategoryRequests = (sellerId: number) =>
  seller.get<{ data: SellerCategoryRequest[] }>('/seller/category-requests', {
    query: { seller_id: sellerId },
  });
export const requestSellerCategory = (input: {
  seller_id: number; parent_id: number | null;
  name_ar: string; name_en: string; reason?: string;
}) => seller.post<{ data: { id: number; status: string } }>('/seller/category-requests', input);

export type ScannedCatalogProduct = {
  id: number;
  category_id: number;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price_halalas: number;
  vat_class: 'standard' | 'zero' | 'exempt';
  sku: string;
  barcode: string | null;
  status: string;
};

export const lookupSellerProductCode = (sellerId: number, code: string) =>
  seller.get<{ data: ScannedCatalogProduct | null }>('/seller/products/code-lookup', {
    query: { seller_id: sellerId, code },
  });

export const createSellerProduct = (sellerId: number, input: SellerProductInput) =>
  seller.post<{ data: SellerProduct }>('/seller/products', { ...input, seller_id: sellerId });

export const deleteSellerProduct = (productId: number) =>
  seller.delete<{ message: string }>('/seller/products/' + productId);

export const updateSellerProduct = (productId: number, input: SellerProductInput) =>
  seller.patch<{ data: SellerProduct }>('/seller/products/' + productId, input);

export const addSellerProductVariant = (
  productId: number,
  variant: { sku: string; barcode?: string | null; name_ar?: string; name_en?: string },
) =>
  seller.post<{ data: { id: number; product_id: number; sku: string; barcode: string | null } }>(
    '/seller/products/' + productId + '/variants',
    variant,
  );

export const submitSellerProduct = (productId: number) =>
  seller.post<{ data: SellerProduct }>('/seller/products/' + productId + '/submit');

export const sellerCatalogTemplate = () => seller.download('/seller/products/import/template.csv');
export const sellerCatalogExcelTemplate = () => seller.download('/seller/products/import/template.xlsx');

export const uploadSellerProductImage = (productId: number, image: File | string) => {
  const form = new FormData();
  if (typeof image === 'string') form.append('image_url', image);
  else form.append('image', image);
  return seller.upload<{ data: { product_id: number; image_path: string } }>(
    '/seller/products/' + productId + '/image',
    form,
  );
};

export type SellerCsvPreview = {
  valid_rows: number;
  created_drafts: number;
  preview: Array<{
    category_id: number;
    name_ar: string;
    name_en: string;
    price_halalas: number;
    sku: string;
  }>;
};

export const importSellerProductCsv = (sellerId: number, file: File, dryRun = false, submitAfterImport = false) => {
  const form = new FormData();
  form.append('seller_id', String(sellerId));
  form.append('file', file);
  if (dryRun) form.append('dry_run', '1');
  if (submitAfterImport && !dryRun) form.append('submit_after_import', '1');
  return seller.upload<{ data: { created_drafts: number; published?: number; submitted_for_review?: number } & Partial<SellerCsvPreview> }>(
    '/seller/products/import',
    form,
  );
};

export type SellerFinanceSummary = {
  seller_id: number;
  currency: 'SAR';
  delivered_orders: number;
  subtotal_halalas: number;
  discount_halalas: number;
  merchandise_total_halalas: number;
  payout_calculated: boolean;
};

export type SellerFinanceLedgerRow = {
  suborder_id: string;
  order_number: string;
  branch_id: number;
  placed_at: string;
  currency: 'SAR';
  merchandise_halalas: number;
};

export const sellerFinanceSummary = (sellerId: number, from: string, to: string) =>
  seller.get<{ data: SellerFinanceSummary }>('/seller/finance/summary', {
    query: { seller_id: sellerId, from, to },
  });

export const sellerFinanceLedger = (sellerId: number, from: string, to: string) =>
  seller.get<{ data: SellerFinanceLedgerRow[]; payout_calculated: boolean }>(
    '/seller/finance/ledger',
    {
      query: { seller_id: sellerId, from, to, limit: 20 },
    },
  );

type SellerOrderExportFilters = { branch_id?: number; status?: string; from?: string; to?: string };

export const exportSellerOrdersExcel = (filters: SellerOrderExportFilters = {}) =>
  seller.download('/seller/orders/export.xlsx', {
    query: { ...filters, lang: getCurrentLanguage() },
    timeoutMs: 60_000,
  });

export const exportSellerOrdersCsv = (filters: SellerOrderExportFilters = {}) =>
  seller.download('/seller/orders/export.csv', {
    query: { ...filters, lang: getCurrentLanguage() },
    timeoutMs: 60_000,
  });

export type SellerStaffMember = {
  id: number;
  user_id: string | number;
  employee_number: string;
  name?: string | null;
  seller_id: number;
  branch_id: number | null;
  role: 'owner' | 'branch_manager' | 'picker' | string;
  is_active: boolean;
};

export const sellerStaff = (sellerId: number) =>
  seller.get<{ data: SellerStaffMember[] }>('/seller/staff', {
    query: { seller_id: sellerId, limit: 100 },
  });

export type SellerStaffInput = {
  role: 'branch_manager' | 'picker';
  branch_id: number;
  is_active: boolean;
};
export const addSellerStaff = (sellerId: number, userId: number, input: SellerStaffInput) =>
  seller.post<{ data: SellerStaffMember }>('/seller/staff', {
    seller_id: sellerId, user_id: userId, role: input.role, branch_id: input.branch_id,
  });
export const updateSellerStaff = (membershipId: number, input: SellerStaffInput) =>
  seller.patch<{ data: SellerStaffMember }>('/seller/staff/' + membershipId, input);

export const deactivateSellerStaff = (membershipId: number) =>
  seller.patch<{ data: { id: number; is_active: boolean } }>(
    '/seller/staff/' + membershipId + '/deactivate',
    {},
  );

export type SellerReturnCase = {
  id: string;
  order_id: string;
  order_item_id: number;
  status: 'submitted' | 'in_review' | 'resolved' | 'rejected';
  seller_responded: number | boolean;
  subject: string;
  quantity: number;
  created_at: string;
  seller_id: number;
  branch_id: number;
  name_ar: string;
  name_en: string;
};

export const sellerReturns = (
  filters: { status?: string; limit?: number; before_id?: string } = {},
) => seller.get<{ data: SellerReturnCase[] }>('/seller/returns', { query: filters });

export const respondSellerReturn = (
  caseId: string,
  position: 'accept' | 'dispute',
  explanation: string,
) =>
  seller.post<{ data: { id: number; case_id: string; position: string } }>(
    '/seller/returns/' + encodeURIComponent(caseId) + '/response',
    { position, explanation },
  );

export type SellerPackingList = {
  order_number: string;
  suborder_id: string;
  branch_id: number;
  status: string;
  created_at: string;
  items: Array<{
    product: { ar: string; en: string };
    variant: { ar: string | null; en: string | null };
    quantity: number;
    variant_id: number;
  }>;
};

export const sellerPackingList = (suborderId: string) =>
  seller.get<{ data: SellerPackingList }>(
    '/seller/orders/' + encodeURIComponent(suborderId) + '/packing-list',
  );

export type SellerSettlementReadiness = {
  seller_id: number;
  currency: 'SAR';
  state: string;
  commission_configured: boolean;
  refund_allocation_verified: boolean;
  finance_approval_verified: boolean;
  payable_halalas: number | null;
  transfer_enabled: boolean;
};

export const sellerSettlementReadiness = (sellerId: number) =>
  seller.get<{ data: SellerSettlementReadiness }>('/seller/finance/settlement-readiness', {
    query: { seller_id: sellerId },
  });
