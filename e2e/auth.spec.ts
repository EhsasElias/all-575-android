import { expect, test } from '@playwright/test';

for (const channel of ['phone', 'email']) {
  test(`create account using ${channel} OTP and legal consent`, async ({ page }) => {
    let requested: unknown;
    let consentChecks = 0;
    await page.route('**/auth/otp/request', async (route) => {
      requested = route.request().postDataJSON();
      await route.fulfill({
        json: {
          data: {
            challenge_id: '11111111-1111-4111-8111-111111111111',
            resend_after: 60,
            expires_in: 300,
          },
        },
      });
    });
    await page.route('**/auth/otp/verify', async (route) => {
      const body: unknown = route.request().postDataJSON();
      if (typeof body !== 'object' || body === null || !('consents' in body)) {
        await route.fulfill({
          status: 422,
          json: {
            message: 'Consent required',
            code: 'consent_required',
            terms_version: '2026-10-01',
            privacy_version: '2026-10-01',
          },
        });
        return;
      }
      consentChecks++;
      await route.fulfill({
        json: {
          data: {
            token: 'browser-test-session',
            is_new_user: true,
            user: {
              id: 1,
              name: 'Sara',
              phone: channel === 'phone' ? '+966512345678' : null,
              email: channel === 'email' ? 'sara@example.com' : null,
              locale: 'en',
              phone_verified: channel === 'phone',
              email_verified: channel === 'email',
              consents: {
                terms_version: '2026-10-01',
                privacy_version: '2026-10-01',
                marketing: false,
                needs_update: false,
              },
            },
          },
        },
      });
    });
    await page.goto('/create-account?next=%2Faccount');
    await expect(page.getByRole('heading', { name: 'Create account', exact: true })).toBeVisible();
    if (channel === 'email') await page.getByRole('button', { name: 'Use email instead' }).click();
    const destination = channel === 'phone' ? '0512345678' : 'sara@example.com';
    await page
      .getByLabel(channel === 'phone' ? 'Mobile number' : 'Email address', { exact: true })
      .fill(destination);
    await page.getByRole('button', { name: 'Send code' }).click();
    await page.getByLabel('6-digit code', { exact: true }).fill('123456');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: /Terms of Use/ })).toBeVisible();
    await expect(page).toHaveURL(/\/create-account\?/);
    await page.getByRole('checkbox', { name: /Terms of Use/ }).check();
    await page.getByRole('checkbox', { name: /Privacy Policy/ }).check();
    await page.getByRole('button', { name: 'Accept and continue' }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole('heading', { name: 'Account', exact: true })).toBeVisible();
    expect(requested).toEqual({ channel, destination });
    expect(consentChecks).toBe(1);
  });
}

test('browser sign-in uses codes and does not simulate fingerprint success', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.getByText(/Fingerprint is available in the Android app/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unlock with fingerprint' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'New here? Create account' })).toBeVisible();
});
