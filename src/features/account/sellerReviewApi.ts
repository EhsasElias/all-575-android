import { http } from '@/shared/api';

export type ReviewOverview = {
  pending_applications: number;
  pending_branches: number;
  pending_products: number;
  pending_categories: number;
  recent_decisions: { id: number; subject_type: string; subject_id: number; previous_status: string; new_status: string; reason: string | null; created_at: string }[];
};
export const reviewOverview = () => http.get<{ data: ReviewOverview }>('/seller-review/overview');

export type SellerReviewApplication = {
  id: number;
  user_id: number;
  legal_name: string;
  commercial_registration: string;
  contact_name: string;
  city: string;
  status: string;
  review_note?: string | null;
  submitted_at?: string | null;
  approved_seller_id?: number | null;
  updated_at?: string | null;
};
export type SellerReviewDocument = {
  id: number;
  document_type: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
};
export type PendingSellerProduct = {
  id: number;
  seller_id: number;
  category_id: number;
  name_ar: string;
  name_en: string;
  price_halalas: number;
  image_path?: string | null;
  status: string;
  created_at?: string | null;
};

export const reviewSellerApplications = (status = 'submitted') =>
  http.get<{ data: SellerReviewApplication[] }>('/seller-review/applications', {
    query: { status, limit: 50 },
  });
export const reviewSellerApplication = (id: number) =>
  http.get<{
    data: {
      application: SellerReviewApplication & Record<string, unknown>;
      documents: SellerReviewDocument[];
    };
  }>('/seller-review/applications/' + id);
export const reviewSellerProducts = () =>
  http.get<{ data: PendingSellerProduct[] }>('/seller-review/products', { query: { limit: 50 } });
export const decideSellerApplication = (
  id: number,
  decision: 'approve' | 'correction' | 'reject',
  reason: string,
) =>
  http.post<{ data: { id: number; status: string; seller_id: number | null } }>(
    '/seller-review/applications/' + id + '/decision',
    { decision, reason: reason.trim() || null },
  );
export const decideSellerProduct = (id: number, decision: 'publish' | 'reject', reason: string) =>
  http.post<{ data: { id: number; status: string } }>(
    '/seller-review/products/' + id + '/decision',
    { decision, reason: reason.trim() || null },
  );
export const downloadReviewDocument = (applicationId: number, documentId: number) =>
  http.download('/seller-review/applications/' + applicationId + '/documents/' + documentId);

export type SellerBranchReview = {
  id: number;
  seller_id: number;
  service_zone_id: number;
  code: string;
  name_ar: string;
  name_en: string;
  lat: number;
  lng: number;
  created_at?: string | null;
};

export const reviewSellerBranches = () =>
  http.get<{ data: SellerBranchReview[] }>('/seller-review/branches');

export const activateSellerBranch = (branchId: number) =>
  http.post<{ data: { id: number; is_active: boolean } }>(
    '/seller-review/branches/' + branchId + '/decision',
    { decision: 'activate' },
  );

export type ManagedCategory = {
  id: number; parent_id: number | null; name_ar: string; name_en: string;
  is_active: boolean; sort_order: number;
};
export type CategoryRequestReview = {
  id: number; seller_id: number; parent_id: number | null;
  name_ar: string; name_en: string; reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  review_note: string | null; category_id: number | null;
  created_at?: string | null;
};
export const reviewCategories = () =>
  http.get<{ data: ManagedCategory[] }>('/seller-review/categories');
export const createManagedCategory = (input: {
  parent_id: number | null; name_ar: string; name_en: string; sort_order?: number;
}) => http.post<{ data: ManagedCategory }>('/seller-review/categories', input);
export const updateManagedCategory = (id: number, input: {
  parent_id?: number | null; name_ar?: string; name_en?: string;
  sort_order?: number; is_active?: boolean;
}) => http.patch<{ data: ManagedCategory }>('/seller-review/categories/' + id, input);
export const deleteManagedCategory = (id: number) =>
  http.delete<{ message: string }>('/seller-review/categories/' + id);
export const reviewCategoryRequests = () =>
  http.get<{ data: CategoryRequestReview[] }>('/seller-review/category-requests');
export const decideCategoryRequest = (id: number, decision: 'approve' | 'reject', reviewNote?: string) =>
  http.post<{ data: { id: number; status: string; category_id: number | null } }>(
    '/seller-review/category-requests/' + id + '/decision',
    { decision, review_note: reviewNote ?? null },
  );
