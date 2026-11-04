import { seller } from './sellerWorkspaceApi';

export type SellerStoreProfile = {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  status: string;
};

export type SellerBranchName = {
  id: number;
  seller_id: number;
  name_ar: string;
  name_en: string;
};

export const getSellerStoreProfile = (sellerId: number) =>
  seller.get<{ data: SellerStoreProfile }>('/seller/stores/' + sellerId);

export const saveSellerStoreProfile = (sellerId: number, names: { name_ar: string; name_en: string }) =>
  seller.patch<{ data: SellerStoreProfile }>('/seller/stores/' + sellerId, names);

export const saveSellerBranchProfile = (branchId: number, names: { name_ar: string; name_en: string }) =>
  seller.patch<{ data: SellerBranchName }>('/seller/branches/' + branchId, names);

export type SellerServiceZone = {
  id: number; name_ar: string; name_en: string;
  center_lat: number; center_lng: number; radius_meters: number;
};

export const getSellerServiceZones = () =>
  seller.get<{ data: SellerServiceZone[] }>('/seller/service-zones');

export const proposeSellerBranch = (input: {
  seller_id: number; service_zone_id: number; code: string;
  name_ar: string; name_en: string; lat: number; lng: number;
}) => seller.post<{ data: { id: number; is_active: boolean; review_required: boolean } }>(
  '/seller/branches', input,
);
