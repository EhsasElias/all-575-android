import type { Translations } from '@/shared/i18n';

const en = {
  emptyTitle: 'Your cart is empty',
  emptyMessage: 'Add the products you like and they will show up here.',
};

const ar: Translations<typeof en> = {
  emptyTitle: 'سلتك فارغة',
  emptyMessage: 'أضف المنتجات التي تعجبك وستظهر هنا.',
};

export const cartLocales = { en, ar };
