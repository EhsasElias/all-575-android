import { expect, test } from '@playwright/test';
import { openApp } from './openApp';

const words = {
  en: {
    title: 'Customer dashboard',
    journey: 'Your shopping steps',
    allTime: 'All-time account summary',
    awaiting: 'Awaiting online payment',
    filters: 'Filter orders',
    status: 'Order status',
    apply: 'Apply filters',
    refresh: 'Refresh summary',
  },
  ar: {
    title: 'لوحة العميل',
    journey: 'خطوات تسوقك',
    allTime: 'ملخص الحساب منذ البداية',
    awaiting: 'بانتظار الدفع الإلكتروني',
    filters: 'تصفية الطلبات',
    status: 'حالة الطلب',
    apply: 'تطبيق الفلاتر',
    refresh: 'تحديث الملخص',
  },
  fr: {
    title: 'Tableau de bord client',
    journey: 'Les étapes de vos achats',
    allTime: 'Résumé du compte depuis le début',
    awaiting: 'Paiement en ligne en attente',
    filters: 'Filtrer les commandes',
    status: 'État de la commande',
    apply: 'Appliquer les filtres',
    refresh: 'Actualiser le résumé',
  },
};
// Synthetic signed-in customer and order fixtures, never live customer data.
const buyer = {
  id: 1,
  name: 'Sara',
  phone: '+966512345678',
  email: null,
  locale: 'en',
  phone_verified: true,
  email_verified: false,
  consents: {
    terms_version: '2026-10-29',
    privacy_version: '2026-10-29',
    marketing: false,
    needs_update: false,
  },
};
const recent = ['pending_payment', 'confirmed', 'completed'].map((status, index) => ({
  id: `demo-order-${index}`,
  number: `A575-DEMO${index}`,
  status,
  total: index === 0 ? 575 : 1575,
  currency: 'SAR',
  placed_at: '2026-10-29T10:00:00Z',
  paid_at: index === 2 ? '2026-10-29T10:01:00Z' : null,
  items_count: 1,
  preview_images: [],
  slot: { starts_at: null, ends_at: null },
  payment_status: index === 2 ? 'paid' : 'pending',
}));

for (const language of ['ar', 'en', 'fr'] as const)
  for (const theme of ['light', 'dark'] as const) {
    test(`customer dashboard and order drilldown: ${language}, ${theme}`, async ({
      page,
    }, testInfo) => {
      let orderQuery = new URLSearchParams();
      await page.route(
        /\/(?:api\/v1\/)?(?:me(?:\/dashboard)?|auth\/otp\/(?:request|verify)|store|cart|categories|orders)(?:\?.*)?$/,
        async (route) => {
          if (route.request().resourceType() === 'document') {
            await route.fallback();
            return;
          }
          const url = new URL(route.request().url());
          let data: unknown = [];
          if (url.pathname.endsWith('/me')) data = buyer;
          if (url.pathname.endsWith('/store'))
            data = {
              currency: 'SAR',
              price: { gross: 575, net: 500, vat: 75 },
              vat_rate_basis_points: 1500,
              terms_version: '2026-10-29',
              privacy_version: '2026-10-29',
            };
          if (url.pathname.endsWith('/auth/otp/request'))
            data = {
              challenge_id: '11111111-1111-4111-8111-111111111111',
              resend_after: 60,
              expires_in: 300,
            };
          if (url.pathname.endsWith('/auth/otp/verify'))
            data = { token: 'browser-test-session', user: buyer, is_new_user: false };
          if (url.pathname.endsWith('/me/dashboard'))
            data = {
              orders_total: 4,
              orders_active: 2,
              orders_awaiting_payment: 1,
              orders_completed: 1,
              paid_total: 3150,
              refunded_total: 0,
              net_spent: 3150,
              currency: 'SAR',
              generated_at: '2026-10-29T10:00:00Z',
              saved_products: 2,
              addresses: 1,
              open_support: 1,
              open_requests: 1,
              recent_orders: recent,
            };
          if (url.pathname.endsWith('/orders')) {
            orderQuery = url.searchParams;
            await route.fulfill({
              json: {
                data: recent.filter(
                  (order) => !orderQuery.get('status') || order.status === orderQuery.get('status'),
                ),
                meta: { next_cursor: null, prev_cursor: null },
                links: { next: null, prev: null },
              },
            });
            return;
          }
          await route.fulfill({ json: { data } });
        },
      );
      await openApp(page, '/sign-in?next=%2Faccount%2Fdashboard');
      await page.getByLabel('Mobile number', { exact: true }).fill('0512345678');
      await page.getByRole('button', { name: 'Send code' }).click();
      await page.getByLabel('6-digit code', { exact: true }).fill('123456');
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await expect(page).toHaveURL(/\/account\/dashboard$/);
      await page.getByRole('button', { name: 'Open menu', exact: true }).click();
      const menu = page.getByRole('dialog');
      await menu
        .locator('label')
        .filter({ has: page.locator(`input[value="${language}"]`) })
        .click();
      await menu
        .locator('label')
        .filter({ has: page.locator(`input[value="${theme}"]`) })
        .click();
      await page.keyboard.press('Escape');
      const text = words[language];
      await expect(page.getByRole('heading', { level: 1, name: text.title })).toBeVisible();
      const journey = page.getByRole('region', { name: text.journey });
      await expect(journey.getByRole('link')).toHaveCount(6);
      const totals = page.getByRole('region', { name: text.allTime });
      await expect(totals).toContainText(/31[.,]50/);
      expect(await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')).toBe(
        true,
      );
      await page.screenshot({
        path: testInfo.outputPath(`dashboard-${language}-${theme}.png`),
        fullPage: true,
      });
      await totals.getByRole('link', { name: new RegExp(text.awaiting) }).click();
      await expect.poll(() => orderQuery.get('status')).toBe('pending_payment');
      await page.getByText(text.filters, { exact: true }).click();
      await expect(page.getByRole('combobox', { name: text.status, exact: true })).toHaveValue(
        'pending_payment',
      );
      await page
        .getByRole('combobox', { name: text.status, exact: true })
        .selectOption('completed');
      await page.getByRole('button', { name: text.apply, exact: true }).click();
      await expect.poll(() => orderQuery.get('status')).toBe('completed');
      await expect(page.getByText(/A575-DEMO2/)).toBeVisible();
      await expect(page.getByText(/A575-DEMO0/)).toHaveCount(0);
    });
  }
