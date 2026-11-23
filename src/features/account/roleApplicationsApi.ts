import { http } from '@/shared/api';

export type RequestedRole = 'admin' | 'courier';
export type RoleApplication = {
  id: number;
  requested_role: RequestedRole;
  status: string;
  vehicle_type: string | null;
  motivation?: string;
  created_at: string;
};

export const myRoleApplications = () =>
  http.get<{ data: RoleApplication[] }>('/me/role-applications');

export const applyForRole = (input: {
  requested_role: RequestedRole;
  motivation: string;
  vehicle_type?: 'car' | 'motorcycle' | 'van' | 'bicycle';
}) => http.post<{ data: RoleApplication }>('/me/role-applications', input);

export type PendingRoleApplication = RoleApplication & {
  user_id: number;
  name: string;
  email: string;
  motivation: string;
};

export const reviewRoleApplications = () =>
  http.get<{ data: PendingRoleApplication[] }>('/platform/super-admin/role-applications');

export type ServiceZoneChoice = { id: number; name_ar: string; name_en: string };

export const reviewServiceZones = () =>
  http.get<{ data: ServiceZoneChoice[] }>('/platform/super-admin/service-zones');

export const decideRoleApplication = (
  applicationId: number,
  decision: 'approved' | 'rejected',
  note: string,
  service_zone_id?: number,
) =>
  http.patch<{ data: RoleApplication }>(
    `/platform/super-admin/role-applications/${applicationId}`,
    { decision, note, ...(service_zone_id ? { service_zone_id } : {}) },
  );
