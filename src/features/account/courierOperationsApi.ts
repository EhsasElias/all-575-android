import { http } from '@/shared/api';

export type CourierChoice = {
  id: number; user_id: number; name: string; service_zone_id: number;
  vehicle_type: string; approval_status: string; is_online: boolean;
};
export type CourierJob = {
  id: number; suborder_id: string; status: string; expires_at: string | null;
  accepted_at: string | null; picked_up_at: string | null; parcel_count: number | null;
  order_number: string; branch_id: number; pickup_lat: number | null; pickup_lng: number | null; suborder_status: string;
};
export type DeliveryIncident = {
  id: number; suborder_id: string; type: string; status: string;
  description: string; resolution: string | null; assigned_to: number | null;
  created_at: string;
};
export type DailyCourierStatus = {
  day: string; open_incidents: number; resolved_today: number;
  ready_orders: number; picked_up_today: number;
};
export const adminCouriers = () =>
  http.get<{data: CourierChoice[]}>('/platform/admin/couriers');
export const adminAssignCourier = (suborderId: string, data: {courier_profile_id: number; reason?: string}) =>
  http.post<{data: {assignment_id: number; status: string}}>('/platform/admin/orders/' + suborderId + '/assign-courier', data);
export const adminPickupCode = (suborderId: string) =>
  http.get<{data: {pickup_code: string}}>('/platform/admin/orders/' + suborderId + '/pickup-code');
export const adminDailyCourierStatus = () =>
  http.get<{data: DailyCourierStatus}>('/platform/admin/daily-status');
export const adminIncidents = () =>
  http.get<{data: DeliveryIncident[]}>('/platform/admin/incidents');
export const adminCreateIncident = (data: {suborder_id: string; type: 'complaint' | 'refund' | 'delivery_issue'; description: string}) =>
  http.post<{data: {id: number}}>('/platform/admin/incidents', data);
export const adminUpdateIncident = (id: number, data: {status: string; resolution?: string}) =>
  http.patch<{data: {id: number; status: string}}>('/platform/admin/incidents/' + id, data);
export const courierJobs = () =>
  http.get<{data: CourierJob[]}>('/courier/jobs');
export const courierAvailability = (is_online: boolean) =>
  http.patch<{data: {is_online: boolean}}>('/courier/availability', {is_online});
export const courierRespond = (id: number, decision: 'accept' | 'decline') =>
  http.post<{data: {status: string}}>('/courier/jobs/' + id + '/respond', {decision});
export const courierPickup = (id: number, pickup_code: string, parcel_count: number) =>
  http.post<{data: {status: string}}>('/courier/jobs/' + id + '/pickup', {pickup_code, parcel_count});

export type CourierAssignmentEvent = {action: string; reason: string | null; actor_user_id: number | null; courier_profile_id: number | null; created_at: string};
export const adminCourierHistory = (suborderId: string) =>
  http.get<{data: CourierAssignmentEvent[]}>('/platform/admin/orders/' + suborderId + '/courier-history');
export const adminRegisterCourier = (data: {user_id: number; service_zone_id: number; vehicle_type: string}) =>
  http.post<{data: {id:number; approval_status:string}}>('/platform/admin/couriers', data);
export const superAdminApproveCourier = (id: number, approved: boolean) =>
  http.patch<{data: {approval_status:string}}>('/platform/super-admin/couriers/' + id + '/approval', {approved});

export const courierProfile = () => http.get<{data: {id: number; is_online: boolean; approval_status: string; vehicle_type: string; service_zone_id: number}}>('/courier/profile');

export const courierDeliver = (id: number, delivery_code: string) =>
  http.post<{data: {status: string; order_id: string}}>('/courier/jobs/' + id + '/deliver', {delivery_code});
export const courierFailedDelivery = (id: number, reason: string, notes?: string) =>
  http.post<{data: {attempt_id: number; status: string}}>('/courier/jobs/' + id + '/failed-attempt', {reason, notes});
export const courierHistory = () =>
  http.get<{data: CourierJob[]; earnings: null; earnings_note: string}>('/courier/history');
