import { http } from '@/shared/api';

export type SuperAdminDashboard = {
  customers: number;
  sellers: number;
  active_sellers: number;
  products: number;
  published_products: number;
  orders: number;
  order_statuses: Record<string, number>;
  suborder_statuses: Record<string, number>;
  pending_seller_applications: number;
  pending_product_reviews: number;
  pending_category_requests: number;
  sales: { paid_orders: number; paid_total_halalas: number; currency: string };
  generated_at: string;
};

export const superAdminDashboard = () =>
  http.get<{ data: SuperAdminDashboard }>('/platform/super-admin/dashboard');

export type SuperAdminMetricKey =
  | 'customers' | 'sellers' | 'active_sellers' | 'products' | 'published_products'
  | 'orders' | 'paid_order_value' | 'paid_orders' | 'awaiting_payment'
  | 'confirmed_orders' | 'completed_orders' | 'ready_for_delivery'
  | 'pending_seller_applications' | 'pending_product_reviews' | 'pending_category_requests';

export type SuperAdminMetricPage = {
  data: Record<string, string | number | boolean | null>[];
  columns: string[];
  total: number;
  page: number;
  last_page: number;
};

export const superAdminMetric = (metric: SuperAdminMetricKey, page = 1) =>
  http.get<SuperAdminMetricPage>('/platform/super-admin/metrics/' + metric, {
    query: { page, per_page: 15 },
  });

export const exportSuperAdminMetric = (metric: SuperAdminMetricKey, format: 'csv' | 'xls') =>
  http.download('/platform/super-admin/metrics/' + metric + '/export/' + format);
