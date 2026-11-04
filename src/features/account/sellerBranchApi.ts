import { http } from '@/shared/api';

export const updateSellerBranch = (branchId: number, names: { name_ar: string; name_en: string }) => http.patch('/seller/branches/' + branchId, names);
