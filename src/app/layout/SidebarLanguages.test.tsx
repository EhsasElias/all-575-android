import { screen, waitFor, within } from '@testing-library/react';
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
  it('keeps the unified Admin sidebar on seller review screens', async () => {
    installFakeApi({
      'GET /me': { body: { data: customer } },
      'GET /store': { body: { data: testStore } },
      'GET /platform/super-admin/dashboard': { body: { data: {} } },
      'GET /seller-review/overview': { status: 403, body: { message: 'Forbidden' } },
    });
    await renderApp({
      route: '/account/seller-review?tab=applications',
      signedIn: true,
      seenWelcome: true,
      language: 'en',
    });
    const menu = await screen.findByRole('navigation', { name: 'Dashboard navigation' });
    await waitFor(() => expect(within(menu).getByText('Admin')).toBeInTheDocument());
    expect(within(menu).getByRole('link', { name: 'Admin approvals' })).toHaveAttribute(
      'href',
      '/account/admin?view=management#admin-applications',
    );
    expect(within(menu).getByRole('link', { name: 'Courier approvals' })).toHaveAttribute(
      'href',
      '/account/admin?view=management#courier-approvals',
    );
    expect(within(menu).getByRole('link', { name: 'Seller applications' })).toHaveAttribute(
      'href',
      '/account/seller-review?tab=applications',
    );
    expect(within(menu).queryByText('Approvals')).not.toBeInTheDocument();
  });

  it('preserves the independent reviewer sidebar without Super Admin access', async () => {
    installFakeApi({
      'GET /me': { body: { data: customer } },
      'GET /store': { body: { data: testStore } },
      'GET /platform/super-admin/dashboard': { status: 403, body: { message: 'Forbidden' } },
      'GET /seller-review/overview': {
        body: {
          data: {
            pending_applications: 0,
            pending_branches: 0,
            pending_products: 0,
            pending_categories: 0,
            recent_decisions: [],
          },
        },
      },
    });
    await renderApp({
      route: '/account/seller-review?tab=applications',
      signedIn: true,
      seenWelcome: true,
      language: 'en',
    });
    const menu = await screen.findByRole('navigation', { name: 'Dashboard navigation' });
    await waitFor(() => expect(within(menu).getByText('Approvals')).toBeInTheDocument());
    expect(within(menu).queryByRole('link', { name: 'Admin approvals' })).not.toBeInTheDocument();
  });

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
