import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi, type FakeRoutes } from '@/test/fakeApi';
import { renderApp } from '@/test/render';
import { customer } from './testData';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function profileApi(patch?: FakeRoutes[string]) {
  return installFakeApi({
    'GET /me': { body: { data: customer } },
    ...(patch === undefined ? {} : { 'PATCH /me': patch }),
  });
}

async function openProfile(language: 'en' | 'ar' = 'en') {
  const result = await renderApp({
    route: '/account/profile',
    signedIn: true,
    seenWelcome: true,
    language,
  });
  await screen.findByLabelText(language === 'en' ? 'Name' : 'الاسم');
  return result;
}

describe('Profile: the guest', () => {
  it('is sent to sign in and brought back afterwards', async () => {
    installFakeApi();
    const { router } = await renderApp({ route: '/account/profile', seenWelcome: true });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/sign-in');
    });
    expect(router.state.location.search).toBe('?next=%2Faccount%2Fprofile');
  });
});

describe('Profile: editing', () => {
  it('shows what is saved and keeps Save off until something changes', async () => {
    profileApi();
    await openProfile();

    expect(screen.getByRole('heading', { level: 1, name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Sara');
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'العربية' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Back to account' })).toHaveAttribute(
      'href',
      '/account',
    );
  });

  it('saves a new name and language, then shows them on the account screen', async () => {
    const user = userEvent.setup();
    const api = profileApi(({ body }) => ({
      body: { data: { ...customer, ...(isRecord(body) ? body : {}) } },
    }));
    const { router } = await openProfile();

    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, '  Sara Ali ');
    await user.click(screen.getByRole('radio', { name: 'العربية' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Your profile is saved.')).toBeVisible();
    const patch = api.calls().find((call) => call.method === 'PATCH');
    expect(patch?.path).toBe('/me');
    expect(patch?.body).toEqual({ name: 'Sara Ali', locale: 'ar' });
    expect(screen.getByLabelText('Name')).toHaveValue('Sara Ali');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();

    await user.click(screen.getByRole('link', { name: 'Back to account' }));
    expect(router.state.location.pathname).toBe('/account');
    expect(await screen.findByText('Sara Ali')).toBeVisible();
  });

  it('removes the name when the field is emptied', async () => {
    const user = userEvent.setup();
    const api = profileApi({ body: { data: { ...customer, name: null } } });
    await openProfile();

    await user.clear(screen.getByLabelText('Name'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await screen.findByText('Your profile is saved.');
    expect(api.calls().find((call) => call.method === 'PATCH')?.body).toEqual({
      name: null,
      locale: 'en',
    });
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });

  it('does not send a name over 100 characters and puts the cursor back in the field', async () => {
    const user = userEvent.setup();
    const api = profileApi({ body: { data: customer } });
    await openProfile();

    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.click(name);
    await user.paste('x'.repeat(101));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByText('Use 100 characters or fewer.')).toBeVisible();
    expect(name).toBeInvalid();
    expect(name).toHaveFocus();
    expect(api.requests()).not.toContain('PATCH /me');

    await user.type(name, '!');
    expect(screen.queryByText('Use 100 characters or fewer.')).not.toBeInTheDocument();
  });

  it('accepts exactly 100 characters', async () => {
    const user = userEvent.setup();
    const api = profileApi({ body: { data: customer } });
    await openProfile();

    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.click(name);
    await user.paste('x'.repeat(100));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(api.requests()).toContain('PATCH /me');
    });
  });

  it('shows the field error next to the name when the server refuses it', async () => {
    const user = userEvent.setup();
    profileApi({
      status: 422,
      body: { message: 'Raw server text', errors: { name: ['Raw server text'] } },
    });
    await openProfile();

    await user.type(screen.getByLabelText('Name'), '!');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('This name cannot be saved. Please check it and try again.'),
    ).toBeVisible();
    expect(screen.getByLabelText('Name')).toBeInvalid();
    expect(screen.queryByText('Raw server text')).not.toBeInTheDocument();
  });

  it('shows a message when the network is down and keeps what was typed', async () => {
    const user = userEvent.setup();
    profileApi('offline');
    await openProfile();

    await user.type(screen.getByLabelText('Name'), ' Ali');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText(
        'We could not reach the server. Check your connection and try again.',
      ),
    ).toBeVisible();
    expect(screen.getByLabelText('Name')).toHaveValue('Sara Ali');
  });

  it('shows a plain message for a server error', async () => {
    const user = userEvent.setup();
    profileApi({ status: 500, body: { message: 'Raw server text' } });
    await openProfile();

    await user.type(screen.getByLabelText('Name'), '!');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('We could not save your profile. Please try again.'),
    ).toBeVisible();
    expect(screen.queryByText('Raw server text')).not.toBeInTheDocument();
  });
});

describe('Profile: the sign-in details', () => {
  it('shows the verified mobile number and says it cannot be changed here', async () => {
    profileApi();
    await openProfile();

    const details = screen.getByRole('region', { name: 'Sign-in details' });
    expect(within(details).getByText('+966 51 234 5678')).toBeVisible();
    expect(within(details).getByText('Verified')).toBeVisible();
    expect(
      within(details).getByText('Your mobile number and email cannot be changed here yet.'),
    ).toBeVisible();
    expect(within(details).queryByRole('button')).not.toBeInTheDocument();
    expect(within(details).queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows an email that is not verified yet', async () => {
    installFakeApi({
      'GET /me': {
        body: {
          data: { ...customer, phone: null, email: 'sara@example.com', email_verified: false },
        },
      },
    });
    await openProfile();

    const details = screen.getByRole('region', { name: 'Sign-in details' });
    expect(within(details).getByText('sara@example.com')).toBeVisible();
    expect(within(details).getByText('Not verified')).toBeVisible();
    expect(within(details).queryByText('Mobile number')).not.toBeInTheDocument();
  });
});

describe('Profile: Arabic', () => {
  it('reads right to left with Arabic labels', async () => {
    profileApi();
    await openProfile('ar');

    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('heading', { level: 1, name: 'الملف الشخصي' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'اللغة المفضّلة' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'حفظ التغييرات' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'العودة إلى حسابي' })).toBeVisible();
  });
});
