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
