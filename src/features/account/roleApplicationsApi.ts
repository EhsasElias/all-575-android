import { http } from '@/shared/api';

export type RequestedRole = 'admin' | 'courier';
export type RoleApplication = {
  id: number;
  requested_role: RequestedRole;
  status: string;
  vehicle_type: string | null;
  motivation?: string;
  contact_phone?: string | null;
  city?: string | null;
  experience_years?: number | null;
  qualification?: string | null;
  service_area?: string | null;
  vehicle_plate_number?: string | null;
  created_at: string;
};

export const myRoleApplications = () =>
  http.get<{ data: RoleApplication[] }>('/me/role-applications');

export const applyForRole = (input: {
  requested_role: RequestedRole;
  motivation: string;
  vehicle_type?: 'car' | 'motorcycle' | 'van' | 'bicycle';
  contact_phone?: string;
  city?: string;
  experience_years?: number;
  qualification?: string;
  service_area?: string;
  vehicle_plate_number?: string;
}) => http.post<{ data: RoleApplication }>('/me/role-applications', input);

export type PendingRoleApplication = RoleApplication & {
  user_id: number;
  name: string;
  email: string;
  activated?: boolean;
  motivation: string;
};

export const reviewRoleApplications = () =>
  http.get<{ data: PendingRoleApplication[] }>('/platform/super-admin/role-applications');

export const decideRoleApplication = (
  applicationId: number,
  decision: 'approved' | 'rejected',
  note: string,
) =>
  http.patch<{ data: RoleApplication }>(
    `/platform/super-admin/role-applications/${applicationId}`,
    { decision, note },
  );

export type DeliveryZoneChoice = { id: number; name_ar: string; name_en: string };

export const superAdminDeliveryZones = () =>
  http.get<{ data: DeliveryZoneChoice[] }>('/platform/super-admin/delivery-zones');

export const activateRoleApplication = (
  applicationId: number,
  input: {
    seller_id?: number;
    service_zone_id?: number;
    can_view_orders?: boolean;
    can_view_inventory?: boolean;
  },
) =>
  http.post<{ data: { role: RequestedRole; access_id?: number; courier_profile_id?: number } }>(
    `/platform/super-admin/role-applications/${applicationId}/activate`,
    input,
  );
