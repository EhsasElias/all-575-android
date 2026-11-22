import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';
import { customer, testStore } from '@/features/account/testData';
import { appResources } from './i18n-resources';

const routes = [
  { path: '/account/profile', title: 'profile' },
  { path: '/account/sessions', title: 'sessions' },
  { path: '/account/billing', title: 'billing' },
  { path: '/account/addresses', title: 'addresses' },
  { path: '/orders', title: 'orders' },
] as const;

type Language = 'ar' | 'en' | 'fr';

function expectedTitle(language: Language, name: (typeof routes)[number]['title']): string {
  const texts = appResources[language];
  switch (name) {
    case 'profile':
      return texts.account.profile.title;
    case 'sessions':
      return texts.account.sessions.title;
    case 'billing':
      return texts.customer.billing;
    case 'addresses':
      return texts.addresses.list.heading;
    case 'orders':
      return texts.orders.list.title;
  }
}

describe('signed-in customer pages in all three languages', () => {
  for (const language of ['ar', 'en', 'fr'] as const) {
    for (const route of routes) {
      it(`shows localized ${route.path} in ${language}`, async () => {
        installFakeApi({
          'GET /me': { body: { data: customer } },
          'GET /store': { body: { data: testStore } },
        });

        await renderApp({ route: route.path, seenWelcome: true, signedIn: true, language });
        expect(
          await screen.findByRole('heading', {
            level: 1,
            name: expectedTitle(language, route.title),
          }),
        ).toBeVisible();
        expect(document.documentElement).toHaveAttribute('lang', language);
        expect(document.documentElement).toHaveAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
      });
    }
  }
});
