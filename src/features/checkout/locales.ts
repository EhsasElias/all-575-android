import type { Translations } from '@/shared/i18n';

const en = {
  emptyTitle: 'Nothing to check out yet',
  emptyMessage: 'Add at least one product to your cart before you check out.',
  action: 'Go to cart',
};

const ar: Translations<typeof en> = {
  emptyTitle: 'لا يوجد ما تدفع ثمنه بعد',
  emptyMessage: 'أضف منتجًا واحدًا على الأقل إلى سلتك قبل إتمام الطلب.',
  action: 'الذهاب إلى السلة',
};

export const checkoutLocales = { en, ar };
