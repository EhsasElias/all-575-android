import { seller } from './sellerWorkspaceApi';

export type SellerStoreProfile = {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  status: string;
};

export type SellerBranchDetails = {
  id: number;
  seller_id: number;
  code: string;
  name_ar: string;
  name_en: string;
  service_zone_id: number;
  service_zone_ids: number[];
  lat: number;
  lng: number;
  is_active: boolean;
};

export const getSellerStoreProfile = (sellerId: number) =>
  seller.get<{ data: SellerStoreProfile }>('/seller/stores/' + sellerId);

export const saveSellerStoreProfile = (
  sellerId: number,
  names: { name_ar: string; name_en: string },
) => seller.patch<{ data: SellerStoreProfile }>('/seller/stores/' + sellerId, names);

export const saveSellerBranchProfile = (
  branchId: number,
  details: Omit<SellerBranchDetails, 'id' | 'seller_id' | 'is_active'>,
) => seller.patch<{ data: SellerBranchDetails }>('/seller/branches/' + branchId, details);

export const deleteSellerBranch = (branchId: number) =>
  seller.delete<{ data: { deleted: boolean } }>('/seller/branches/' + branchId);

export type SellerServiceZone = {
  id: number;
  name_ar: string;
  name_en: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
};

export const getSellerServiceZones = () =>
  seller.get<{ data: SellerServiceZone[] }>('/seller/service-zones');

export const proposeSellerBranch = (input: {
  seller_id: number;
  service_zone_id: number;
  service_zone_ids?: number[];
  code: string;
  name_ar: string;
  name_en: string;
  lat: number;
  lng: number;
}) =>
  seller.post<{ data: { id: number; is_active: boolean; review_required: boolean } }>(
    '/seller/branches',
    input,
  );

export const createSellerServiceZone = (input: {
  seller_id: number;
  name_ar: string;
  name_en: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
}) => seller.post<{ data: SellerServiceZone }>('/seller/service-zones', input);
