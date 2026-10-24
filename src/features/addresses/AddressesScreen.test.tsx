import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderAddresses } from './addressTestHarness';
import { addressNumber, homeAddress, jeddahAddress } from './testData';

vi.mock('./LeafletMap', async () => {
  const { FakePinMap } = await import('./testMap');
  return { LeafletMap: FakePinMap };
});

const LIST = '/account/addresses';
const urlOf = (input: Parameters<typeof fetch>[0]) =>
  typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
const list = (...addresses: object[]) => ({ body: { data: addresses } });

describe('Address book', () => {
  it('lists each address with its default badge and whether we deliver there', async () => {
    await renderAddresses({
      route: LIST,
      routes: { 'GET /addresses': list(homeAddress, jeddahAddress) },
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'My addresses' })).toBeVisible();
    const home = screen.getByRole('article', { name: /Home/ });
    expect(within(home).getByText('Default')).toBeVisible();
    expect(within(home).getByText('We deliver here')).toBeVisible();
    expect(within(home).getByText(/King Fahd Rd, Al Olaya, Riyadh, Riyadh/)).toBeVisible();
    expect(within(home).getByText(/Building 1234, additional no\. 5678/)).toBeVisible();
    expect(within(home).getByText(/Short address RRRD2929/)).toBeVisible();
    expect(
      within(home).queryByRole('button', { name: /Set .* as default/ }),
    ).not.toBeInTheDocument();

    const jeddah = screen.getByRole('article', { name: /Jeddah flat/ });
    expect(within(jeddah).queryByText('Default')).not.toBeInTheDocument();
    expect(within(jeddah).getByText('We do not deliver here yet')).toBeVisible();
    expect(within(jeddah).getByText(/If the pin is in the wrong place, edit it/)).toBeVisible();
    expect(within(jeddah).getByRole('link', { name: 'Edit Jeddah flat' })).toHaveAttribute(
      'href',
      '/account/addresses/2',
    );
  });

  it('shows a skeleton while loading', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { router } = await renderAddresses({
      route: '/home',
      routes: { 'GET /addresses': list(homeAddress) },
    });
    const real = globalThis.fetch;
    vi.stubGlobal('fetch', (input: Parameters<typeof fetch>[0], init?: RequestInit) =>
      urlOf(input).includes('/addresses') ? gate.then(() => real(input, init)) : real(input, init),
    );

    await act(() => router.navigate(LIST));

    expect(await screen.findByRole('status', { name: 'Loading your addresses' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 1, name: 'My addresses' })).toBeVisible();
    release();
    expect(await screen.findByRole('article', { name: /Home/ })).toBeVisible();
    expect(
      screen.queryByRole('status', { name: 'Loading your addresses' }),
    ).not.toBeInTheDocument();
  });

  it('makes another address the default and says so', async () => {
    const user = userEvent.setup();
    let promoted = false;
    const { api } = await renderAddresses({
      route: LIST,
      routes: {
        'GET /addresses': () =>
          list(
            { ...homeAddress, is_default: !promoted },
            { ...addressNumber(3, { label: 'Work' }), is_default: promoted },
          ),
        'PUT /addresses/:id/default': () => {
          promoted = true;
          return { body: { data: addressNumber(3, { label: 'Work', is_default: true }) } };
        },
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Set Work as default' }));

    expect(await screen.findByText('Work is now your default address.')).toBeVisible();
    expect(api.requests()).toContain('PUT /addresses/3/default');
    const work = await screen.findByRole('article', { name: /Work/ });
    expect(await within(work).findByText('Default')).toBeVisible();
  });

  it('asks before deleting, and deletes only after the confirmation', async () => {
    const user = userEvent.setup();
    let deleted = false;
    const { api } = await renderAddresses({
      route: LIST,
      routes: {
        'GET /addresses': () => list(...(deleted ? [homeAddress] : [homeAddress, jeddahAddress])),
        'DELETE /addresses/:id': () => {
          deleted = true;
          return { status: 204 };
        },
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Delete Jeddah flat' }));
    const sheet = screen.getByRole('dialog', { name: 'Delete this address?' });
    expect(within(sheet).getByText(/Jeddah flat will be removed/)).toBeVisible();

    await user.click(within(sheet).getByRole('button', { name: 'Keep it' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.requests()).not.toContain('DELETE /addresses/2');

    await user.click(screen.getByRole('button', { name: 'Delete Jeddah flat' }));
    await user.click(screen.getByRole('button', { name: 'Delete address' }));

    expect(await screen.findByText('Address deleted.')).toBeVisible();
    expect(api.requests()).toContain('DELETE /addresses/2');
    expect(screen.queryByRole('article', { name: /Jeddah flat/ })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'My addresses' })).toHaveFocus();
    });
  });

  it('says what went wrong when a change fails, and keeps the address', async () => {
    const user = userEvent.setup();
    await renderAddresses({
      route: LIST,
      routes: {
        'GET /addresses': list(homeAddress, jeddahAddress),
        'DELETE /addresses/:id': { status: 500, body: { message: 'Boom' } },
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Delete Jeddah flat' }));
    await user.click(screen.getByRole('button', { name: 'Delete address' }));

    expect(await screen.findByText('We could not do that. Please try again.')).toBeVisible();
    expect(screen.getByRole('article', { name: /Jeddah flat/ })).toBeVisible();
  });

  it('invites the customer to add a first address when there are none', async () => {
    await renderAddresses({ route: LIST, routes: { 'GET /addresses': list() } });

    expect(
      await screen.findByRole('heading', { level: 2, name: 'No saved addresses yet' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Add your first address' })).toHaveAttribute(
      'href',
      '/account/addresses/new',
    );
  });

  it('stops offering to add when ten addresses are saved', async () => {
    const ten = Array.from({ length: 10 }, (_, index) => addressNumber(index + 1));
    await renderAddresses({ route: LIST, routes: { 'GET /addresses': list(...ten) } });

    expect(
      await screen.findByText(
        'You have saved 10 addresses, the most we can keep. Delete one to add another.',
      ),
    ).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Add address' })).not.toBeInTheDocument();
  });

  it('offers to add another address below nine', async () => {
    await renderAddresses({ route: LIST, routes: { 'GET /addresses': list(homeAddress) } });

    expect(await screen.findByRole('link', { name: 'Add address' })).toHaveAttribute(
      'href',
      '/account/addresses/new',
    );
  });

  it('shows an error state with a retry', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    await renderAddresses({
      route: LIST,
      routes: {
        'GET /addresses': () => {
          attempts += 1;
          return attempts <= 3 ? { status: 500, body: { message: 'Boom' } } : list(homeAddress);
        },
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Try again' }, { timeout: 5000 }));

    expect(await screen.findByRole('article', { name: /Home/ })).toBeVisible();
  });

  it('is in Arabic and right to left', async () => {
    await renderAddresses({
      route: LIST,
      language: 'ar',
      routes: { 'GET /addresses': list(homeAddress, jeddahAddress) },
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'عناويني' })).toBeVisible();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByText('الافتراضي')).toBeVisible();
    expect(screen.getByText('نوصّل إلى هذا العنوان')).toBeVisible();
    expect(screen.getByText('لا نوصّل إلى هذا العنوان حاليًا')).toBeVisible();
    expect(screen.getByRole('button', { name: 'حذف Jeddah flat' })).toBeVisible();
    expect(screen.queryByText('My addresses')).not.toBeInTheDocument();
  });
});
