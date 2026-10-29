import { spendingFiltersEn, spendingFiltersAr, spendingFiltersFr } from './strings/spendingFilters';
import { orderFiltersEn, orderFiltersAr, orderFiltersFr } from './strings/orderFilters';
import type { Translations } from '@/shared/i18n';
import { deliveriesAr, deliveriesEn, deliveriesFr } from './strings/deliveries';
import { listAr, listEn, listFr } from './strings/list';
import { paymentsAr, paymentsEn, paymentsFr } from './strings/payments';
import { reviewsAr, reviewsEn, reviewsFr } from './strings/reviews';
import { spendingAr, spendingEn, spendingFr } from './strings/spending';
import { statusAr, statusEn, statusFr } from './strings/status';

// The text is split by screen to keep each file small; the namespace is still one: `orders`.
const en = {
  ...orderFiltersEn,
  ...spendingFiltersEn,
  ...statusEn,
  ...listEn,
  ...deliveriesEn,
  ...paymentsEn,
  ...reviewsEn,
  ...spendingEn,
};

const ar: Translations<typeof en> = {
  ...orderFiltersAr,
  ...spendingFiltersAr,
  ...statusAr,
  ...listAr,
  ...deliveriesAr,
  ...paymentsAr,
  ...reviewsAr,
  ...spendingAr,
};

const fr: Translations<typeof en> = {
  ...orderFiltersFr,
  ...spendingFiltersFr,
  ...statusFr,
  ...listFr,
  ...deliveriesFr,
  ...paymentsFr,
  ...reviewsFr,
  ...spendingFr,
};

export const ordersLocales = { en, ar, fr };
