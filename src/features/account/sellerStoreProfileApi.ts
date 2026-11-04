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
