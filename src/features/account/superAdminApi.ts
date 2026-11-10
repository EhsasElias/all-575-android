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
  sales: { paid_orders: number; paid_total_halalas: number; currency: string };
  generated_at: string;
};

export const superAdminDashboard = () =>
  http.get<{ data: SuperAdminDashboard }>('/platform/super-admin/dashboard');
