import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { tokenStore } from '@/shared/api';
import { getPreference } from '@/shared/storage';
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';
import { customer, customerWithOldTerms, customerWithoutName, testStore } from './testData';

/** The `granted` choice of a `PUT /me/consents/marketing` body. */
function isGranted(body: unknown): boolean {
  return typeof body === 'object' && body !== null && 'granted' in body && body.granted === true;
}

function signedInApi(user = customer) {
  return installFakeApi({
    'GET /me': { body: { data: user } },
    'GET /store': { body: { data: testStore } },
  });
}

describe('Account: a guest', () => {
  it('explains the benefits and offers to sign in, coming back here afterwards', async () => {
    installFakeApi();
    await renderApp({ route: '/account', seenWelcome: true });

    expect(screen.getByRole('heading', { level: 1, name: 'Your account' })).toBeInTheDocument();
    expect(screen.getByText('Order and follow your deliveries')).toBeInTheDocument();
    expect(screen.getByText('Save your delivery addresses')).toBeInTheDocument();
    expect(screen.getByText('See what you have spent')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in or create an account' })).toHaveAttribute(
      'href',
      '/sign-in?next=%2Faccount',
    );
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Manage your account' }),
    ).not.toBeInTheDocument();
  });

  it('has the language switch and the legal links', async () => {
    installFakeApi();
    await renderApp({ route: '/account', seenWelcome: true });

    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute(
      'href',
      '/legal/terms',
    );
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/legal/privacy',
    );
  });

  it('switches the whole screen to English and remembers it', async () => {
    const user = userEvent.setup();
    installFakeApi();
    await renderApp({ route: '/account', seenWelcome: true, language: 'ar' });
    expect(screen.getByRole('heading', { level: 1, name: 'حسابك' })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /EN/ }));

    expect(screen.getByRole('heading', { level: 1, name: 'Your account' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
    expect(getPreference('language')).toBe('en');
  });

  it('reads right to left in Arabic', async () => {
    installFakeApi();
    await renderApp({ route: '/account', seenWelcome: true, language: 'ar' });

    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('link', { name: 'تسجيل الدخول أو إنشاء حساب' })).toBeVisible();
    expect(screen.getByText('حفظ عناوين التوصيل')).toBeVisible();
    expect(screen.queryByText('Save your delivery addresses')).not.toBeInTheDocument();
  });
});

describe('Account: a signed-in customer', () => {
  it('shows who is signed in, with the full mobile number', async () => {
    signedInApi();
    await renderApp({ route: '/account', signedIn: true, seenWelcome: true });

    expect(await screen.findByRole('heading', { level: 1, name: 'Account' })).toBeInTheDocument();
    const summary = screen.getByRole('region', { name: 'Your details' });
    expect(within(summary).getByText('Sara')).toBeVisible();
    expect(within(summary).getByText('+966 51 234 5678')).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Sign in or create an account' }),
    ).not.toBeInTheDocument();
  });

  it('links to every part of the account', async () => {
    signedInApi();
    await renderApp({ route: '/account', signedIn: true, seenWelcome: true });

    const menu = await screen.findByRole('navigation', { name: 'Manage your account' });
    const hrefs = within(menu)
      .getAllByRole('link')
      .map((link) => [link.textContent, link.getAttribute('href')]);
    expect(hrefs).toEqual([
      ['ProfileYour name and language', '/account/profile'],
      ['OrdersTrack and review your orders', '/orders'],
      ['AddressesWhere we deliver', '/account/addresses'],
      ['SpendingWhat you have spent, and your history', '/account/spending'],
      ['DevicesWhere you are signed in', '/account/sessions'],
    ]);
  });

  it('invites a customer without a name to add one', async () => {
    signedInApi(customerWithoutName);
    await renderApp({ route: '/account', signedIn: true, seenWelcome: true });

    expect(await screen.findByText('Your name is not set')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Add your name' })).toHaveAttribute(
      'href',
      '/account/profile',
    );
  });

  it('shows no notice when the legal texts are up to date', async () => {
    signedInApi();
    await renderApp({ route: '/account', signedIn: true, seenWelcome: true });

    await screen.findByRole('heading', { level: 1, name: 'Account' });
    expect(screen.queryByText('Our terms were updated')).not.toBeInTheDocument();
  });

  it('shows a notice, with links to the texts, when the legal texts changed', async () => {
    signedInApi(customerWithOldTerms);
    await renderApp({ route: '/account', signedIn: true, seenWelcome: true });

    const notice = await screen.findByRole('region', { name: 'Our terms were updated' });
    expect(within(notice).getByText(/the next time you sign in/)).toBeVisible();
    expect(within(notice).getByRole('link', { name: 'Terms of Use' })).toHaveAttribute(
      'href',
      '/legal/terms',
    );
    expect(within(notice).getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/legal/privacy',
    );
  });

  it('is in Arabic, right to left', async () => {
    signedInApi();
    await renderApp({ route: '/account', signedIn: true, seenWelcome: true, language: 'ar' });

    expect(await screen.findByRole('heading', { level: 1, name: 'حسابي' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('link', { name: /الملف الشخصي/ })).toHaveAttribute(
      'href',
      '/account/profile',
    );
    expect(screen.getByRole('button', { name: 'تسجيل الخروج' })).toBeVisible();
  });
});

describe('Account: the marketing switch', () => {
  it('turns marketing on, saves it, and shows it on', async () => {
    const user = userEvent.setup();
    const api = installFakeApi({
      'GET /me': { body: { data: customer } },
      'PUT /me/consents/marketing': ({ body }) => ({
        body: {
          data: {
            ...customer,
            consents: { ...customer.consents, marketing: isGranted(body) },
          },
        },
      }),
    });
    await renderApp({ route: '/account', signedIn: true, seenWelcome: true });
    const marketing = await screen.findByRole('switch', { name: 'Offers and news' });
    expect(marketing).not.toBeChecked();

    await user.click(marketing);

    expect(await screen.findByText('Your choice is saved.')).toBeVisible();
    expect(screen.getByRole('switch', { name: 'Offers and news' })).toBeChecked();
    const put = api.calls().find((call) => call.method === 'PUT');
    expect(put?.path).toBe('/me/consents/marketing');
    expect(put?.body).toEqual({ granted: true });
  });

  it('turns marketing off again', async () => {
    const user = userEvent.setup();
    const subscribed = { ...customer, consents: { ...customer.consents, marketing: true } };
    const api = installFakeApi({
      'GET /me': { body: { data: subscribed } },
      'PUT /me/consents/marketing': { body: { data: customer } },
    });
    await renderApp({ route: '/account', signedIn: true, seenWelcome: true });

    await user.click(await screen.findByRole('switch', { name: 'Offers and news' }));

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Offers and news' })).not.toBeChecked();
    });
    expect(api.calls().find((call) => call.method === 'PUT')?.body).toEqual({ granted: false });
  });

  it('keeps the old choice and says so when saving fails', async () => {
    const user = userEvent.setup();
    installFakeApi({
      'GET /me': { body: { data: customer } },
      'PUT /me/consents/marketing': { status: 500, body: { message: 'boom' } },
    });
    await renderApp({ route: '/account', signedIn: true, seenWelcome: true });

    await user.click(await screen.findByRole('switch', { name: 'Offers and news' }));

    expect(
      await screen.findByText('We could not save your choice. Please try again.'),
    ).toBeVisible();
    expect(screen.getByRole('switch', { name: 'Offers and news' })).not.toBeChecked();
    expect(screen.queryByText('boom')).not.toBeInTheDocument();
  });
});

describe('Account: signing out', () => {
  it('asks first, and does nothing when the customer stays', async () => {
    const user = userEvent.setup();
    const api = signedInApi();
    await renderApp({ route: '/account', signedIn: true, seenWelcome: true });

    await user.click(await screen.findByRole('button', { name: 'Sign out' }));
    const dialog = screen.getByRole('dialog', { name: 'Sign out of this device?' });
    expect(within(dialog).getByText(/You will need a new code to sign in again/)).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Stay signed in' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.requests()).not.toContain('DELETE /auth/session');
    expect(await tokenStore.get()).not.toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Account' })).toBeVisible();
  });

  it('signs out, forgets the token and goes home with a message', async () => {
    const user = userEvent.setup();
    const api = signedInApi();
    const { router } = await renderApp({ route: '/account', signedIn: true, seenWelcome: true });

    await user.click(await screen.findByRole('button', { name: 'Sign out' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Sign out of this device?' })).getByRole('button', {
        name: 'Sign out',
      }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/home');
    });
    expect(await screen.findByText('You are signed out.')).toBeVisible();
    expect(api.requests()).toContain('DELETE /auth/session');
    expect(await tokenStore.get()).toBeNull();
  });
});
