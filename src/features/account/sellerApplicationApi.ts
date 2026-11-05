import { http } from '@/shared/api';

export type SellerApplication = {
  id: number;
  status: string;
  review_note?: string | null;
  submitted_at?: string | null;
  legal_name: string;
  commercial_registration: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  city: string;
  national_unified_number: string | null;
  vat_number: string | null;
} & SellerExtendedFields;
export type SellerExtendedFields = {
  entity_type?: string | null;
  commercial_registration_status?: string | null;
  commercial_registration_issue_date?: string | null;
  commercial_registration_expiry_date?: string | null;
  chamber_of_commerce_number?: string | null;
  building_number?: string | null;
  postal_code?: string | null;
  additional_number?: string | null;
  street?: string | null;
  district?: string | null;
  iban?: string | null;
};
export type SellerApplicationInput = Omit<SellerApplication, 'id' | 'status'> &
  SellerExtendedFields;
export const getSellerApplication = async () =>
  (await http.get<{ data: SellerApplication | null }>('/seller/application')).data;
export const saveSellerApplication = async (input: SellerApplicationInput) =>
  (await http.put<{ data: SellerApplication }>('/seller/application', input)).data;
export const submitSellerApplication = async () =>
  (await http.post<{ data: SellerApplication }>('/seller/application/submit')).data;

export type SellerApplicationDocument = {
  id?: number;
  document_type:
    'commercial_registration' | 'vat_certificate' | 'national_address' | 'iban_certificate';
  original_name: string;
  mime_type?: string;
  size_bytes: number;
  created_at?: string;
};

export const getSellerApplicationDocuments = async () =>
  (await http.get<{ data: SellerApplicationDocument[] }>('/seller/application/documents')).data;

export const uploadSellerApplicationDocument = async (
  documentType: SellerApplicationDocument['document_type'],
  file: File,
) => {
  const payload = new FormData();
  payload.append('document_type', documentType);
  payload.append('file', file);
  return (
    await http.upload<{ data: SellerApplicationDocument }>('/seller/application/documents', payload)
  ).data;
};
