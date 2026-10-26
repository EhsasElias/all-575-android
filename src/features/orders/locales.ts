import type { Translations } from '@/shared/i18n';
import { deliveriesAr, deliveriesEn, deliveriesFr } from './strings/deliveries';
import { listAr, listEn, listFr } from './strings/list';
import { paymentsAr, paymentsEn, paymentsFr } from './strings/payments';
import { reviewsAr, reviewsEn, reviewsFr } from './strings/reviews';
import { spendingAr, spendingEn, spendingFr } from './strings/spending';
import { statusAr, statusEn, statusFr } from './strings/status';

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

const fr: Translations<typeof en> = {
  ...statusFr,
  ...listFr,
  ...deliveriesFr,
  ...paymentsFr,
  ...reviewsFr,
  ...spendingFr,
};

export const ordersLocales = { en, ar, fr };
