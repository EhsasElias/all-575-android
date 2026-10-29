import { expect, test } from '@playwright/test';
import { openApp } from './openApp';

const labels = {
  en: {
    terms: 'Cancellation, returns and refunds',
    privacy: 'Your rights and requests',
    notice: 'Draft for review before public launch',
  },
  ar: {
    terms: 'الإلغاء والإرجاع واسترداد المبالغ',
    privacy: 'حقوقك وتقديم الطلبات',
    notice: 'مسودة للمراجعة قبل الإطلاق العام',
  },
  fr: {
    terms: 'Annulation, retours et remboursements',
    privacy: 'Vos droits et demandes',
    notice: 'Projet à valider avant lancement public',
  },
};

for (const language of ['ar', 'en', 'fr'] as const) {
  for (const document of ['terms', 'privacy'] as const) {
    test(`read detailed ${document} without signing in: ${language}`, async ({
      page,
    }, testInfo) => {
      await page.route('**/store', (route) =>
        route.fulfill({
          json: {
            data: {
              currency: 'SAR',
              price: { gross: 575, net: 500, vat: 75 },
              vat_rate_basis_points: 1500,
              terms_version: '2026-10-29',
              privacy_version: '2026-10-29',
            },
          },
        }),
      );
      await openApp(page, `/legal/${document}`);
      await page.getByRole('button', { name: 'Open menu', exact: true }).click();
      const menu = page.getByRole('dialog');
      await menu
        .locator('label')
        .filter({ has: page.locator(`input[value="${language}"]`) })
        .click();
      await menu
        .locator('label')
        .filter({ has: page.locator(`input[value="${language === 'ar' ? 'dark' : 'light'}"]`) })
        .click();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('note', { name: labels[language].notice })).toBeVisible();
      await expect(page.locator('main')).toContainText('2026-10-29');
      const contentsLink = page.getByRole('link', {
        name: labels[language][document],
        exact: true,
      });
      await contentsLink.click();
      await expect(page).toHaveURL(
        new RegExp(
          `/legal/${document}#${document}-${document === 'terms' ? 'returns' : 'rights'}$`,
        ),
      );
      const section = page.getByRole('region', { name: labels[language][document], exact: true });
      await expect(section).toBeVisible();
      expect((await section.locator('p').innerText()).length).toBeGreaterThan(200);
      expect(await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')).toBe(
        true,
      );
      await page.screenshot({ path: testInfo.outputPath(`${document}-${language}.png`) });
    });
  }
}
