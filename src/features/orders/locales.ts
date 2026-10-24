import type { Translations } from '@/shared/i18n';
import { deliveriesAr, deliveriesEn } from './strings/deliveries';
import { listAr, listEn } from './strings/list';
import { paymentsAr, paymentsEn } from './strings/payments';
import { reviewsAr, reviewsEn } from './strings/reviews';
import { spendingAr, spendingEn } from './strings/spending';
import { statusAr, statusEn } from './strings/status';

// The text is split by screen to keep each file small; the namespace is still one: `orders`.
const en = {
  ...statusEn,
  ...listEn,
  ...deliveriesEn,
  ...paymentsEn,
  ...reviewsEn,
  ...spendingEn,
};

const ar: Translations<typeof en> = {
  ...statusAr,
  ...listAr,
  ...deliveriesAr,
  ...paymentsAr,
  ...reviewsAr,
  ...spendingAr,
};

export const ordersLocales = { en, ar };
