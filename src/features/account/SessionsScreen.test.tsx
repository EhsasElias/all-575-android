import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi, type FakeRoutes } from '@/test/fakeApi';
import { renderApp } from '@/test/render';
import { currentSession, customer, laptopSession, phoneSession } from './testData';

function sessionsApi(routes: FakeRoutes = {}) {
  return installFakeApi({
    'GET /me': { body: { data: customer } },
    'GET /me/sessions': { body: { data: [currentSession, phoneSession, laptopSession] } },
    ...routes,
  });
}

async function openSessions(language: 'en' | 'ar' = 'en') {
  return renderApp({
    route: '/account/sessions',
    signedIn: true,
    seenWelcome: true,
    language,
  });
}

function cardOf(name: string): HTMLElement {
  const card = screen.getByText(name).closest('li');
  if (!card) throw new Error(`No device card for ${name}`);
  return card;
}

describe('Devices: the list', () => {
  it('shows every device, marks this one and offers to sign out only the others', async () => {
    sessionsApi();
    await openSessions();

    expect(await screen.findByRole('heading', { level: 1, name: 'Devices' })).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: 'Signed-in devices' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);

    const current = cardOf('Web browser');
    expect(within(current).getByText('This device')).toBeVisible();
    expect(within(current).queryByRole('button')).not.toBeInTheDocument();
    // 17:05 UTC is 20:05 in Riyadh.
    expect(within(current).getByText('Last active: Oct 24, 2026, 8:05 PM')).toBeVisible();
    expect(within(current).getByText('Signed in: Oct 20, 2026, 12:30 PM')).toBeVisible();

    expect(
      within(cardOf('Android app')).getByRole('button', { name: 'Sign out this device' }),
    ).toBeVisible();
    expect(
      within(cardOf('Sara laptop')).getByRole('button', { name: 'Sign out this device' }),
    ).toBeVisible();
    expect(within(cardOf('Sara laptop')).queryByText(/Last active/)).not.toBeInTheDocument();
  });

  it('shows a loading state while the devices are being fetched', async () => {
    sessionsApi();
    await openSessions();

    expect(screen.getByRole('status', { name: 'Loading your devices' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    await screen.findByRole('list', { name: 'Signed-in devices' });
    expect(screen.queryByRole('status', { name: 'Loading your devices' })).not.toBeInTheDocument();
  });

  it('shows an empty state with a next step', async () => {
    sessionsApi({ 'GET /me/sessions': { body: { data: [] } } });
    await openSessions();

    expect(
      await screen.findByRole('heading', { level: 2, name: 'No devices to show' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to account' })).toHaveAttribute(
      'href',
      '/account',
    );
  });

  it('shows an error state and loads again on retry', async () => {
    const user = userEvent.setup();
    let working = false;
    sessionsApi({
      'GET /me/sessions': () =>
        working ? { body: { data: [currentSession] } } : { status: 403, body: { message: 'no' } },
    });
    await openSessions();

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load your devices');
    working = true;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('list', { name: 'Signed-in devices' })).toBeVisible();
  });
});

describe('Devices: signing out another device', () => {
  it('asks first, and does nothing when cancelled', async () => {
    const user = userEvent.setup();
    const api = sessionsApi();
    await openSessions();
    await screen.findByRole('list', { name: 'Signed-in devices' });

    await user.click(
      within(cardOf('Android app')).getByRole('button', { name: 'Sign out this device' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Sign out Android app?' });
    expect(
      within(dialog).getByText('That device will need a new code to sign in again.'),
    ).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.requests().filter((request) => request.startsWith('DELETE'))).toEqual([]);
  });

  it('signs the device out and refreshes the list', async () => {
    const user = userEvent.setup();
    let revoked = false;
    const api = sessionsApi({
      'GET /me/sessions': () => ({
        body: {
          data: revoked
            ? [currentSession, laptopSession]
            : [currentSession, phoneSession, laptopSession],
        },
      }),
      'DELETE /me/sessions/:id': () => {
        revoked = true;
        return { status: 204 };
      },
    });
    await openSessions();
    await screen.findByRole('list', { name: 'Signed-in devices' });

    await user.click(
      within(cardOf('Android app')).getByRole('button', { name: 'Sign out this device' }),
    );
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Sign out device' }),
    );

    expect(await screen.findByText('The device is signed out.')).toBeVisible();
    await waitFor(() => {
      expect(screen.queryByText('Android app')).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.requests()).toContain('DELETE /me/sessions/12');
    expect(screen.getByText('Sara laptop')).toBeVisible();
  });

  it('keeps the dialog open with a message when it fails, and can try again', async () => {
    const user = userEvent.setup();
    let failing = true;
    const api = sessionsApi({
      'DELETE /me/sessions/:id': () =>
        failing ? { status: 500, body: { message: 'Raw' } } : { status: 204 },
    });
    await openSessions();
    await screen.findByRole('list', { name: 'Signed-in devices' });
    await user.click(
      within(cardOf('Sara laptop')).getByRole('button', { name: 'Sign out this device' }),
    );

    await user.click(screen.getByRole('button', { name: 'Sign out device' }));

    expect(
      await screen.findByText('We could not sign out that device. Please try again.'),
    ).toBeVisible();
    expect(screen.getByRole('dialog', { name: 'Sign out Sara laptop?' })).toBeVisible();
    expect(screen.queryByText('Raw')).not.toBeInTheDocument();

    failing = false;
    await user.click(screen.getByRole('button', { name: 'Sign out device' }));

    expect(await screen.findByText('The device is signed out.')).toBeVisible();
    expect(api.requests().filter((request) => request === 'DELETE /me/sessions/13')).toHaveLength(
      2,
    );
  });

  it('says so when the device was already signed out somewhere else', async () => {
    const user = userEvent.setup();
    sessionsApi({ 'DELETE /me/sessions/:id': { status: 404, body: { message: 'Not found' } } });
    await openSessions();
    await screen.findByRole('list', { name: 'Signed-in devices' });
    await user.click(
      within(cardOf('Android app')).getByRole('button', { name: 'Sign out this device' }),
    );

    await user.click(screen.getByRole('button', { name: 'Sign out device' }));

    expect(await screen.findByText('That device was already signed out.')).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Devices: Arabic', () => {
  it('reads right to left and names our own apps in Arabic', async () => {
    sessionsApi();
    await openSessions('ar');

    expect(await screen.findByRole('heading', { level: 1, name: 'الأجهزة' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(await screen.findByText('تطبيق أندرويد')).toBeVisible();
    expect(screen.getByText('متصفح الويب')).toBeVisible();
    expect(screen.getByText('هذا الجهاز')).toBeVisible();
    expect(screen.getByText('Sara laptop')).toBeVisible();
    expect(screen.getByText(/آخر نشاط: .*2026.*8:05/)).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'تسجيل الخروج من هذا الجهاز' })).toHaveLength(2);
  });
});
