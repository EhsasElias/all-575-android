import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fillNationalAddress, renderAddresses, waitForAddressLookup } from './addressTestHarness';
import { homeAddress, jeddahAddress } from './testData';

vi.mock('./LeafletMap', async () => {
  const { FakePinMap } = await import('./testMap');
  return { LeafletMap: FakePinMap };
});

const created = (body: object) => ({ status: 201, body: { data: body } });

describe('Add an address', () => {
  it('sends the National Address and the pin, then says we deliver there', async () => {
    const user = userEvent.setup();
    const { api } = await renderAddresses({
      routes: { 'POST /addresses': () => created(homeAddress) },
    });
    await screen.findByRole('heading', { level: 1, name: 'New address' });

    await user.type(screen.getByLabelText('Address name (optional)'), 'Home');
    await fillNationalAddress(user);
    // Typed the way a customer might: lower case with a space, and Arabic digits.
    await user.type(screen.getByLabelText('Short address (optional)'), 'rrrd 2929');
    await user.clear(screen.getByLabelText('Building number'));
    await user.type(screen.getByLabelText('Building number'), '١٢٣٤');
    await user.click(screen.getByRole('button', { name: 'Tap the map in Riyadh' }));
    await waitForAddressLookup();
    await user.click(screen.getByRole('button', { name: 'Save address' }));

    const saved = await screen.findByRole('heading', { level: 2, name: 'Address saved' });
    expect(saved).toHaveFocus();
    expect(
      screen.getByText('We deliver to this address. You can use it when you check out.'),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to my addresses' })).toHaveAttribute(
      'href',
      '/account/addresses',
    );

    const post = api.calls().find((call) => call.method === 'POST' && call.path === '/addresses');
    expect(post?.body).toEqual({
      label: 'Home',
      recipient_name: 'Sara',
      recipient_phone: '+966512345678',
      region: 'Riyadh',
      city: 'Riyadh',
      district: 'Al Olaya',
      street: 'King Fahd Rd',
      building_number: '1234',
      additional_number: '5678',
      postal_code: '12211',
      short_address: 'RRRD2929',
      unit: null,
      floor: null,
      delivery_notes: null,
      lat: 24.7136,
      lng: 46.6753,
    });
  });

  it('asks for the default flag only when it is ticked', async () => {
    const user = userEvent.setup();
    const { api } = await renderAddresses({
      routes: { 'POST /addresses': () => created(homeAddress) },
    });
    await screen.findByRole('heading', { level: 1, name: 'New address' });

    await fillNationalAddress(user);
    await user.click(screen.getByRole('button', { name: 'Tap the map in Riyadh' }));
    await user.click(screen.getByLabelText('Make this my default address'));
    await waitForAddressLookup();
    await user.click(screen.getByRole('button', { name: 'Save address' }));

    await screen.findByRole('heading', { level: 2, name: 'Address saved' });
    const post = api.calls().find((call) => call.method === 'POST');
    expect(post?.body).toMatchObject({ is_default: true });
  });

  it('tells the truth when we do not deliver there, and offers to move the pin or pick another address', async () => {
    const user = userEvent.setup();
    const { api } = await renderAddresses({
      routes: {
        'POST /addresses': () => created(jeddahAddress),
        'PUT /addresses/:id': () => ({ body: { data: homeAddress } }),
      },
    });
    await screen.findByRole('heading', { level: 1, name: 'New address' });

    await fillNationalAddress(user);
    await user.click(screen.getByRole('button', { name: 'Tap the map in Jeddah' }));
    expect(
      await screen.findByText(
        'We do not deliver to this area yet. You can still save the address.',
      ),
    ).toBeVisible();
    await waitForAddressLookup();
    await user.click(screen.getByRole('button', { name: 'Save address' }));

    const panel = await screen.findByRole('region', {
      name: 'Saved, but we do not deliver here yet',
    });
    expect(within(panel).getByText(/outside the areas we deliver to/)).toBeVisible();
    expect(within(panel).getByRole('link', { name: 'Choose another address' })).toHaveAttribute(
      'href',
      '/account/addresses',
    );

    // Moving the pin and saving again updates the address that was just created; it does not add a second one.
    await user.click(within(panel).getByRole('button', { name: 'Edit the pin' }));
    expect(await screen.findByRole('button', { name: 'Use my current location' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Tap the map in Riyadh' }));
    await fillNationalAddress(user);
    await waitForAddressLookup();
    await user.click(screen.getByRole('button', { name: 'Save address' }));

    await screen.findByRole('heading', { level: 2, name: 'Address saved' });
    const writes = api.requests().filter((request) => /^(POST|PUT) \/addresses/.test(request));
    expect(writes).toEqual(['POST /addresses', 'PUT /addresses/2']);
  });

  it('sends the customer back to checkout after saving when they came from there', async () => {
    const user = userEvent.setup();
    await renderAddresses({
      route: '/account/addresses/new?next=%2Fcheckout',
      routes: { 'POST /addresses': () => created(homeAddress) },
    });
    await screen.findByRole('heading', { level: 1, name: 'New address' });

    await fillNationalAddress(user);
    await user.click(screen.getByRole('button', { name: 'Tap the map in Riyadh' }));
    await waitForAddressLookup();
    await user.click(screen.getByRole('button', { name: 'Save address' }));

    expect(await screen.findByRole('link', { name: 'Continue' })).toHaveAttribute(
      'href',
      '/checkout',
    );
  });

  it('ignores a next link that points outside the app', async () => {
    const user = userEvent.setup();
    await renderAddresses({
      route: '/account/addresses/new?next=https%3A%2F%2Fevil.example',
      routes: { 'POST /addresses': () => created(homeAddress) },
    });
    await screen.findByRole('heading', { level: 1, name: 'New address' });

    await fillNationalAddress(user);
    await user.click(screen.getByRole('button', { name: 'Tap the map in Riyadh' }));
    await waitForAddressLookup();
    await user.click(screen.getByRole('button', { name: 'Save address' }));

    expect(await screen.findByRole('link', { name: 'Continue' })).toHaveAttribute('href', '/home');
  });
});
