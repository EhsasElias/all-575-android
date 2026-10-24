import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { installFakeApi, type FakeRoutes } from '@/test/fakeApi';
import { testStore } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { forgetFlow } from './signInMemory';
import { hasConsents, requestCode, submitCode } from './testActions';
import { CHALLENGE_ID, CODE, consentRequired, issuedChallenge, verifiedLogin } from './testData';

const NEW_VERSIONS = { terms: '2026-10-02', privacy: '2026-10-03' };

/** A new customer: the first check of the code asks for consent, the second one (with it) signs in. */
function newCustomerApi(extra: FakeRoutes = {}) {
  return installFakeApi({
    'POST /auth/otp/request': issuedChallenge,
    'POST /auth/otp/verify': ({ body }) =>
      hasConsents(body) ? verifiedLogin({ isNewUser: true }) : consentRequired(NEW_VERSIONS),
    ...extra,
  });
}

async function reachConsentStep(user: ReturnType<typeof userEvent.setup>) {
  await requestCode(user);
  await submitCode(user);
  await screen.findByRole('heading', { level: 2, name: 'Accept to continue' });
}

beforeEach(forgetFlow);

describe('Sign in: a new customer', () => {
  it('accepts the terms without asking for a new code', async () => {
    const user = userEvent.setup();
    const api = newCustomerApi();
    const { router } = await renderApp({ route: '/sign-in?next=%2Faccount', seenWelcome: true });
    await reachConsentStep(user);

    await user.click(screen.getByRole('checkbox', { name: /Terms of Use/ }));
    await user.click(screen.getByRole('checkbox', { name: /Privacy Policy/ }));
    await user.click(screen.getByRole('checkbox', { name: /Send me offers and news/ }));
    await user.click(screen.getByRole('button', { name: 'Accept and continue' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/account');
    });
    expect(await screen.findByText('Your account is ready. Welcome to ALL 5.75!')).toBeVisible();
    const auth = api.calls().filter((call) => call.path.startsWith('/auth'));
    expect(auth.map((call) => call.path)).toEqual([
      '/auth/otp/request',
      '/auth/otp/verify',
      '/auth/otp/verify',
    ]);
    // The same challenge and the same code, now with the versions the server asked for.
    expect(auth[2]?.body).toEqual({
      challenge_id: CHALLENGE_ID,
      code: CODE,
      device_name: 'Web browser',
      consents: {
        terms_version: NEW_VERSIONS.terms,
        privacy_version: NEW_VERSIONS.privacy,
        marketing: true,
      },
    });
  });

  it('sends marketing as false when the optional box is left unticked', async () => {
    const user = userEvent.setup();
    const api = newCustomerApi();
    await renderApp({ route: '/sign-in', seenWelcome: true });
    await reachConsentStep(user);

    await user.click(screen.getByRole('checkbox', { name: /Terms of Use/ }));
    await user.click(screen.getByRole('checkbox', { name: /Privacy Policy/ }));
    await user.click(screen.getByRole('button', { name: 'Accept and continue' }));

    await screen.findByText('Your account is ready. Welcome to ALL 5.75!');
    const last = api.calls().filter((call) => call.path === '/auth/otp/verify')[1];
    expect(last?.body).toMatchObject({ consents: { marketing: false } });
  });

  it('starts with every box unticked and names the version of each text', async () => {
    const user = userEvent.setup();
    newCustomerApi();
    await renderApp({ route: '/sign-in', seenWelcome: true });
    await reachConsentStep(user);

    for (const name of [/Terms of Use/, /Privacy Policy/, /Send me offers and news/]) {
      expect(screen.getByRole('checkbox', { name })).not.toBeChecked();
    }
    expect(screen.getByRole('checkbox', { name: /Terms of Use/ })).toHaveAccessibleDescription(
      'Version 2026-10-02',
    );
    expect(screen.getByRole('checkbox', { name: /Privacy Policy/ })).toHaveAccessibleDescription(
      'Version 2026-10-03',
    );
    expect(screen.getByText('(optional)', { exact: false })).toBeInTheDocument();
  });

  it('links to the legal pages', async () => {
    const user = userEvent.setup();
    newCustomerApi();
    await renderApp({ route: '/sign-in', seenWelcome: true });
    await reachConsentStep(user);

    expect(screen.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute(
      'href',
      '/legal/terms',
    );
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/legal/privacy',
    );
  });

  it('refuses to continue until both required boxes are ticked, and says which one is missing', async () => {
    const user = userEvent.setup();
    const api = newCustomerApi();
    await renderApp({ route: '/sign-in', seenWelcome: true });
    await reachConsentStep(user);

    await user.click(screen.getByRole('button', { name: 'Accept and continue' }));

    expect(screen.getByText('Accept the Terms of Use to continue.')).toBeInTheDocument();
    expect(screen.getByText('Accept the Privacy Policy to continue.')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Terms of Use/ })).toHaveFocus();
    expect(screen.getByRole('checkbox', { name: /Terms of Use/ })).toBeInvalid();

    await user.click(screen.getByRole('checkbox', { name: /Terms of Use/ }));
    expect(screen.queryByText('Accept the Terms of Use to continue.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Accept and continue' }));

    expect(screen.getByRole('checkbox', { name: /Privacy Policy/ })).toHaveFocus();
    expect(screen.getByText('Accept the Privacy Policy to continue.')).toBeInTheDocument();
    expect(api.calls().filter((call) => call.path === '/auth/otp/verify')).toHaveLength(1);
  });

  it('uses the current versions from the store settings when the server does not name them', async () => {
    const user = userEvent.setup();
    const api = installFakeApi({
      'POST /auth/otp/request': issuedChallenge,
      'POST /auth/otp/verify': ({ body }) =>
        hasConsents(body)
          ? verifiedLogin({ isNewUser: true })
          : { status: 422, body: { message: 'x', code: 'consent_required' } },
      'GET /store': {
        body: {
          data: { ...testStore, terms_version: '2026-11-01', privacy_version: '2026-11-02' },
        },
      },
    });
    await renderApp({ route: '/sign-in', seenWelcome: true });
    await requestCode(user);
    await submitCode(user);

    await user.click(await screen.findByRole('checkbox', { name: /Terms of Use/ }));
    await user.click(screen.getByRole('checkbox', { name: /Privacy Policy/ }));
    await user.click(screen.getByRole('button', { name: 'Accept and continue' }));

    await screen.findByText('Your account is ready. Welcome to ALL 5.75!');
    const last = api.calls().filter((call) => call.path === '/auth/otp/verify')[1];
    expect(last?.body).toMatchObject({
      consents: { terms_version: '2026-11-01', privacy_version: '2026-11-02' },
    });
  });

  it('offers a retry when the current versions cannot be loaded', async () => {
    const user = userEvent.setup();
    let storeWorks = false;
    installFakeApi({
      'POST /auth/otp/request': issuedChallenge,
      'POST /auth/otp/verify': { status: 422, body: { message: 'x', code: 'consent_required' } },
      'GET /store': () => (storeWorks ? { body: { data: testStore } } : { status: 500, body: {} }),
    });
    await renderApp({ route: '/sign-in', seenWelcome: true });
    await requestCode(user);
    await submitCode(user);

    const retry = await screen.findByRole('button', { name: 'Try again' }, { timeout: 5000 });
    storeWorks = true;
    await user.click(retry);

    expect(await screen.findByRole('checkbox', { name: /Terms of Use/ })).toBeInTheDocument();
  });

  it('can go back to change the number', async () => {
    const user = userEvent.setup();
    newCustomerApi();
    await renderApp({ route: '/sign-in', seenWelcome: true });
    await reachConsentStep(user);

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByLabelText('Mobile number')).toHaveValue('0512345678');
  });

  it('comes back to the same step after reading the terms, with no new code', async () => {
    const user = userEvent.setup();
    const api = newCustomerApi();
    const { router } = await renderApp({ route: '/sign-in', seenWelcome: true });
    await reachConsentStep(user);

    await user.click(screen.getByRole('link', { name: 'Terms of Use' }));
    expect(router.state.location.pathname).toBe('/legal/terms');
    expect(await screen.findByRole('heading', { level: 1, name: 'Terms of Use' })).toBeVisible();
    await act(async () => {
      await router.navigate(-1);
    });

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Accept to continue' }),
    ).toBeVisible();
    expect(api.calls().filter((call) => call.path === '/auth/otp/request')).toHaveLength(1);
  });

  it('shows the consent step in Arabic', async () => {
    const user = userEvent.setup();
    newCustomerApi();
    await renderApp({ route: '/sign-in', seenWelcome: true, language: 'ar' });
    await user.type(screen.getByLabelText('رقم الجوال'), '0512345678');
    await user.click(screen.getByRole('button', { name: 'إرسال الرمز' }));
    await user.type(await screen.findByLabelText('رمز التحقق (6 أرقام)'), CODE);
    await user.click(screen.getByRole('button', { name: 'متابعة' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'وافق للمتابعة' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: /شروط الاستخدام/ })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /سياسة الخصوصية/ })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /العروض والأخبار/ })).not.toBeChecked();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });
});

describe('Sign in: the terms change while the customer is reading them', () => {
  it('asks again for the newer versions, with the boxes unticked, and still needs no new code', async () => {
    const user = userEvent.setup();
    let consentAttempts = 0;
    const api = installFakeApi({
      'POST /auth/otp/request': issuedChallenge,
      'POST /auth/otp/verify': ({ body }) => {
        if (!hasConsents(body)) return consentRequired(NEW_VERSIONS);
        consentAttempts += 1;
        return consentAttempts === 1
          ? consentRequired({ terms: '2026-10-09', privacy: '2026-10-09' })
          : verifiedLogin({ isNewUser: true });
      },
    });
    await renderApp({ route: '/sign-in', seenWelcome: true });
    await reachConsentStep(user);
    await user.click(screen.getByRole('checkbox', { name: /Terms of Use/ }));
    await user.click(screen.getByRole('checkbox', { name: /Privacy Policy/ }));

    await user.click(screen.getByRole('button', { name: 'Accept and continue' }));

    expect(
      await screen.findByText('Our terms were just updated. Please read and accept them again.'),
    ).toBeVisible();
    expect(screen.getByRole('checkbox', { name: /Terms of Use/ })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Terms of Use/ })).toHaveAccessibleDescription(
      'Version 2026-10-09',
    );
    expect(api.calls().filter((call) => call.path === '/auth/otp/request')).toHaveLength(1);
  });
});
