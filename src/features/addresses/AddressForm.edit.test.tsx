import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderAddresses } from './addressTestHarness';
import { homeAddress, jeddahAddress } from './testData';

vi.mock('./LeafletMap', async () => {
  const { FakePinMap } = await import('./testMap');
  return { LeafletMap: FakePinMap };
});

describe('Edit an address', () => {
  it('loads the saved address with its pin, saves changes with PUT and does not offer to add it as default again', async () => {
    const user = userEvent.setup();
    const { api } = await renderAddresses({
      route: '/account/addresses/1',
      routes: {
        'GET /addresses/1': { body: { data: homeAddress } },
        'PUT /addresses/1': () => ({ body: { data: { ...homeAddress, street: 'Olaya St' } } }),
      },
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'Edit address' })).toBeVisible();
    expect(await screen.findByLabelText('Street')).toHaveValue('King Fahd Rd');
    expect(screen.getByLabelText('Short address (optional)')).toHaveValue('RRRD2929');
    expect(await screen.findByTestId('pin')).toHaveTextContent('24.7136,46.6753');
    expect(screen.queryByLabelText('Make this my default address')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Street'));
    await user.type(screen.getByLabelText('Street'), 'Olaya St');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Address updated' })).toBeVisible();
    const put = api.calls().find((call) => call.method === 'PUT');
    expect(put?.path).toBe('/addresses/1');
    expect(put?.body).toMatchObject({
      street: 'Olaya St',
      short_address: 'RRRD2929',
      lat: 24.7136,
      lng: 46.6753,
    });
    expect(put?.body).not.toHaveProperty('is_default');
  });

  it('offers to make a non-default address the default', async () => {
    const user = userEvent.setup();
    const { api } = await renderAddresses({
      route: '/account/addresses/2',
      routes: {
        'GET /addresses/2': { body: { data: jeddahAddress } },
        'PUT /addresses/2': () => ({ body: { data: jeddahAddress } }),
      },
    });

    await user.click(await screen.findByLabelText('Make this my default address'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await screen.findByRole('heading', { level: 2, name: 'Saved, but we do not deliver here yet' });
    const put = api.calls().find((call) => call.method === 'PUT');
    expect(put?.body).toMatchObject({ is_default: true });
  });

  it('says the address was not found when the server answers 404 (also for someone else’s address)', async () => {
    await renderAddresses({
      route: '/account/addresses/99',
      routes: { 'GET /addresses/99': { status: 404, body: { message: 'Not found' } } },
    });

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Address not found' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to my addresses' })).toHaveAttribute(
      'href',
      '/account/addresses',
    );
  });

  it('does not ask the server about an id that is not a number', async () => {
    const { api } = await renderAddresses({ route: '/account/addresses/abc' });

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Address not found' }),
    ).toBeVisible();
    expect(api.requests().some((request) => request.startsWith('GET /addresses'))).toBe(false);
  });

  it('shows an error state with a retry when the address cannot be loaded', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    await renderAddresses({
      route: '/account/addresses/1',
      routes: {
        'GET /addresses/1': () => {
          attempts += 1;
          return attempts <= 3
            ? { status: 500, body: { message: 'Boom' } }
            : { body: { data: homeAddress } };
        },
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Try again' }, { timeout: 5000 }));

    expect(await screen.findByLabelText('Street')).toHaveValue('King Fahd Rd');
  });

  it('shows the edit title and right-to-left layout in Arabic', async () => {
    await renderAddresses({
      route: '/account/addresses/1',
      language: 'ar',
      routes: { 'GET /addresses/1': { body: { data: homeAddress } } },
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'تعديل العنوان' })).toBeVisible();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(await screen.findByRole('button', { name: 'حفظ التعديلات' })).toBeVisible();
  });
});
