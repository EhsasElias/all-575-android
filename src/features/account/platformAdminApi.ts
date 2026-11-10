import { http } from '@/shared/api';

export type PlatformAdminAccess = {
  id: number;
  user_id: number;
  name?: string;
  email?: string | null;
  seller_id: number;
  seller_name_ar?: string;
  seller_name_en?: string;
  is_active: boolean;
  can_view_orders: boolean;
  can_view_inventory: boolean;
  can_review_sellers: boolean;
};

export type PlatformAdminDashboard = {
  assigned_sellers: number;
  order_access_sellers: number;
  inventory_access_sellers: number;
  suborders: number;
  suborder_statuses: Record<string, number>;
  stock_records: number;
  low_stock_records: number;
  generated_at: string;
};

export const adminDashboard = () =>
  http.get<{ data: PlatformAdminDashboard }>('/platform/admin/dashboard');

export const adminAssignments = () =>
  http.get<{ data: PlatformAdminAccess[] }>('/platform/super-admin/admins');

export const addAdminAssignment = (data: {
  email: string; seller_id: number; can_view_orders: boolean; can_view_inventory: boolean;
}) => http.post<{ data: PlatformAdminAccess }>('/platform/super-admin/admins', data);

export const updateAdminAssignment = (id: number, data: {
  is_active?: boolean; can_view_orders?: boolean; can_view_inventory?: boolean;
}) => http.patch<{ data: PlatformAdminAccess }>('/platform/super-admin/admins/' + id, data);

export type PlatformAdminOrder = {
  id: string; order_number: string; seller_id: number;
  seller_name_ar: string; seller_name_en: string; branch_id: number;
  status: string; placed_at: string | null;
  ready_at: string | null; picked_up_at: string | null;
};

export const adminOrders = (filters: { limit?: number; status?: string; before_id?: string } = {}) =>
  http.get<{ data: PlatformAdminOrder[] }>('/platform/admin/orders', { query: filters });
