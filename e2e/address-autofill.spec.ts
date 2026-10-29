import { expect, test } from '@playwright/test';
import { openApp } from './openApp';

// Synthetic account/address fixtures only; no real customer records.
const buyer = {
  id: 1,
  name: 'Sara',
  phone: '+966512345678',
  email: null,
  locale: 'en',
  phone_verified: true,
  email_verified: false,
  consents: {
    terms_version: '2026-10-01',
    privacy_version: '2026-10-01',
    marketing: false,
    needs_update: false,
  },
};

for (const language of ['en', 'ar', 'fr'] as const) {
  test(`selected map pin fills an editable address: ${language}`, async ({ page }, testInfo) => {
    let written: unknown;
    await page.route(/\/tile\.openstreetmap\.org\//, (route) => route.abort());
    await page.route(
      /\/(?:api\/v1\/)?(?:auth\/otp\/(?:request|verify)|me|store|cart|categories|addresses(?:\/resolve)?|zones\/resolve)(?:\?.*)?$/,
      async (route) => {
        const path = new URL(route.request().url()).pathname;
        let data: unknown = [];
        if (path.endsWith('/me')) data = buyer;
        if (path.endsWith('/store'))
          data = {
            currency: 'SAR',
            price: { gross: 575, net: 500, vat: 75 },
            vat_rate_basis_points: 1500,
            terms_version: '2026-10-01',
            privacy_version: '2026-10-01',
          };
        if (path.endsWith('/auth/otp/request'))
          data = {
            challenge_id: '11111111-1111-4111-8111-111111111111',
            resend_after: 60,
            expires_in: 300,
          };
        if (path.endsWith('/auth/otp/verify'))
          data = { token: 'browser-test-session', user: buyer, is_new_user: false };
        if (path.endsWith('/addresses/resolve'))
          data = {
            country_code: 'sa',
            region: 'Riyadh Region',
            city: 'Riyadh',
            district: 'Al Olaya',
            street: 'Test Street',
            building_number: '1234',
            postal_code: '12211',
          };
        if (path.endsWith('/zones/resolve')) data = { serviceable: false, zone: null };
        if (path.endsWith('/addresses') && route.request().method() === 'POST') {
          written = route.request().postDataJSON();
          data = {
            ...route.request().postDataJSON(),
            id: 1,
            is_default: true,
            serviceable: false,
            service_zone_id: null,
          };
        }
        await route.fulfill({ json: { data } });
      },
    );
    await openApp(page, '/sign-in?next=%2Faccount%2Faddresses%2Fnew');
    await page.getByLabel('Mobile number', { exact: true }).fill('0512345678');
    await page.getByRole('button', { name: 'Send code' }).click();
    await page.getByLabel('6-digit code', { exact: true }).fill('123456');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page).toHaveURL(/\/account\/addresses\/new$/);
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    const menu = page.getByRole('dialog');
    await menu.locator(`input[value="${language}"]`).check({ force: true });
    await menu
      .locator('label')
      .filter({ has: page.locator(`input[value="${language === 'ar' ? 'dark' : 'light'}"]`) })
      .click();
    await page.keyboard.press('Escape');
    await page
      .getByRole('button', {
        name: {
          en: 'Place the pin at the middle of the map',
          ar: 'ضع الدبوس في منتصف الخريطة',
          fr: 'Placer le repère au milieu de la carte',
        }[language],
      })
      .click();
    const city = page.locator('#address-city');
    await expect(city).toHaveValue('Riyadh');
    await expect(page.locator('#address-buildingNumber')).toHaveValue('1234');
    await expect(page.locator('#address-additionalNumber')).toHaveValue('');
    await page.locator('#address-street').fill('Corrected Street');
    await page.locator('#address-additionalNumber').fill('5678');
    await city.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath(`filled-address-${language}.png`),
      fullPage: true,
    });
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('button[type="submit"]')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    expect(written).toMatchObject({
      city: 'Riyadh',
      street: 'Corrected Street',
      additional_number: '5678',
      postal_code: '12211',
    });
  });
}
