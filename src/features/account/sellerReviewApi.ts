import { http } from '@/shared/api';

export type SellerReviewApplication = {
  id: number; user_id: number; legal_name: string; commercial_registration: string;
  contact_name: string; city: string; status: string; review_note?: string | null;
  submitted_at?: string | null; approved_seller_id?: number | null;
};
export type SellerReviewDocument = {
  id: number; document_type: string; original_name: string;
  mime_type: string; size_bytes: number;
};
export type PendingSellerProduct = {
  id: number; seller_id: number; category_id: number;
  name_ar: string; name_en: string; price_halalas: number;
  image_path?: string | null; status: string;
};

export const reviewSellerApplications = (status = 'submitted') =>
  http.get<{ data: SellerReviewApplication[] }>('/seller-review/applications', { query: { status, limit: 50 } });
export const reviewSellerApplication = (id: number) =>
  http.get<{ data: { application: SellerReviewApplication & Record<string, unknown>; documents: SellerReviewDocument[] } }>(
    '/seller-review/applications/' + id,
  );
export const reviewSellerProducts = () =>
  http.get<{ data: PendingSellerProduct[] }>('/seller-review/products', { query: { limit: 50 } });
export const decideSellerApplication = (id: number, decision: 'approve' | 'correction' | 'reject', reason: string) =>
  http.post<{ data: { id: number; status: string; seller_id: number | null } }>(
    '/seller-review/applications/' + id + '/decision', { decision, reason: reason.trim() || null },
  );
export const decideSellerProduct = (id: number, decision: 'publish' | 'reject', reason: string) =>
  http.post<{ data: { id: number; status: string } }>(
    '/seller-review/products/' + id + '/decision', { decision, reason: reason.trim() || null },
  );
export const downloadReviewDocument = (applicationId: number, documentId: number) =>
  http.download('/seller-review/applications/' + applicationId + '/documents/' + documentId);

export type SellerBranchReview = {
  id: number; seller_id: number; service_zone_id: number; code: string;
  name_ar: string; name_en: string; lat: number; lng: number;
};

export const reviewSellerBranches = () =>
  http.get<{ data: SellerBranchReview[] }>('/seller-review/branches');

export const activateSellerBranch = (branchId: number) =>
  http.post<{ data: { id: number; is_active: boolean } }>(
    '/seller-review/branches/' + branchId + '/decision', { decision: 'activate' },
  );
