import type { Translations } from '@/shared/i18n';

const en = {
  emptyTitle: 'No orders yet',
  emptyMessage: 'Your orders will show up here after your first purchase.',
};

const ar: Translations<typeof en> = {
  emptyTitle: 'لا توجد طلبات بعد',
  emptyMessage: 'ستظهر طلباتك هنا بعد أول عملية شراء.',
};

export const ordersLocales = { en, ar };
