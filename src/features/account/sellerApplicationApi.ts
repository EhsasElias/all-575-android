import { http } from '@/shared/api';

export type SellerApplication = { id: number; status: string; legal_name: string; commercial_registration: string; contact_name: string; contact_email: string; contact_phone: string; city: string; national_unified_number: string | null; vat_number: string | null };
export type SellerApplicationInput = Omit<SellerApplication, 'id' | 'status'>;
export const getSellerApplication = async () => (await http.get<{ data: SellerApplication | null }>('/seller/application')).data;
export const saveSellerApplication = async (input: SellerApplicationInput) => (await http.put<{ data: SellerApplication }>('/seller/application', input)).data;
export const submitSellerApplication = async () => (await http.post<{ data: SellerApplication }>('/seller/application/submit')).data;
