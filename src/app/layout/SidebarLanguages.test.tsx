import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';
import { customer, testStore } from '@/features/account/testData';

const labels = {
  ar: {
    account: 'قائمة الحساب',
    billing: 'بيانات الفوترة',
    requests: 'طلباتي الخاصة',
    dashboard: 'قائمة لوحة التحكم',
    overview: 'ملخص العميل',
    becomeAdmin: 'الانضمام كمسؤول',
    becomeDelivery: 'الانضمام كمندوب توصيل',
  },
  en: {
    account: 'Account navigation',
    billing: 'Billing',
    requests: 'Requests',
    dashboard: 'Dashboard navigation',
    overview: 'Customer overview',
    becomeAdmin: 'Become Admin',
    becomeDelivery: 'Become Delivery',
  },
  fr: {
    account: 'Navigation du compte',
    billing: 'Facturation',
    requests: 'Demandes',
    dashboard: 'Navigation du tableau de bord',
    overview: 'Tableau de bord client',
    becomeAdmin: 'Devenir administrateur',
    becomeDelivery: 'Devenir livreur',
  },
} as const;

function mockCustomer() {
  installFakeApi({
    'GET /me': { body: { data: customer } },
    'GET /store': { body: { data: testStore } },
  });
}

describe('every account and dashboard navigation language', () => {
  for (const language of ['ar', 'en', 'fr'] as const) {
    it(`renders account links in ${language}`, async () => {
      mockCustomer();
      await renderApp({ route: '/account', signedIn: true, seenWelcome: true, language });
      const text = labels[language];
      const navigation = await screen.findByRole('navigation', { name: text.account });
      expect(within(navigation).getByRole('link', { name: text.billing })).toHaveAttribute(
        'href',
        '/account/billing',
      );
      expect(within(navigation).getByRole('link', { name: text.requests })).toHaveAttribute(
        'href',
        '/account/requests',
      );
      expect(within(navigation).getByRole('link', { name: text.becomeAdmin })).toHaveAttribute(
        'href',
        '/account/apply/admin',
      );
      expect(within(navigation).getByRole('link', { name: text.becomeDelivery })).toHaveAttribute(
        'href',
        '/account/apply/courier',
      );
      expect(document.documentElement).toHaveAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    });

    it(`renders customer dashboard links in ${language}`, async () => {
      mockCustomer();
      await renderApp({ route: '/account/dashboard', signedIn: true, seenWelcome: true, language });
      const text = labels[language];
      const navigation = await screen.findByRole('navigation', { name: text.dashboard });
      expect(within(navigation).getByRole('link', { name: text.overview })).toHaveAttribute(
        'href',
        '/account/dashboard',
      );
      expect(document.documentElement).toHaveAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    });
  }
});
