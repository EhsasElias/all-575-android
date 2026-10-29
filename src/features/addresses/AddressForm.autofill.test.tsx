import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderAddresses, waitForAddressLookup } from './addressTestHarness';
import type { MapAddress } from './api';
import { addressesLocales } from './locales';
import { homeAddress } from './testData';

vi.mock('./LeafletMap', async () => {
  const { FakePinMap } = await import('./testMap');
  return { LeafletMap: FakePinMap };
});

const suggestion: MapAddress = {
  country_code: 'sa',
  region: 'Riyadh Region',
  city: 'Riyadh',
  district: 'Al Olaya',
  street: 'Test Street',
  building_number: '1234',
  postal_code: '12211',
};

describe('Address details from the selected map location', () => {
  it.each(['en', 'ar', 'fr'] as const)(
    'fills available editable fields in %s',
    async (language) => {
      const user = userEvent.setup();
      const { api } = await renderAddresses({
        language,
        routes: {
          'GET /addresses/resolve': { body: { data: suggestion } },
        },
      });
      const words = addressesLocales[language];
      await screen.findByRole('heading', { level: 1, name: words.titles.new });
      expect(api.requests()).not.toContain('GET /addresses/resolve');
      await user.click(await screen.findByRole('button', { name: 'Tap the map in Riyadh' }));
      expect(await screen.findByText(words.form.pin.lookup.filled)).toBeVisible();
      expect(screen.getByLabelText(words.form.fields.city)).toHaveValue('Riyadh');
      expect(screen.getByLabelText(words.form.fields.street)).toHaveValue('Test Street');
      expect(screen.getByLabelText(words.form.fields.buildingNumber)).toHaveValue('1234');
      expect(screen.getByLabelText(words.form.fields.postalCode)).toHaveValue('12211');
      expect(screen.getByLabelText(words.form.fields.additionalNumber)).toHaveValue('');
      const request = api.calls().find((call) => call.path === '/addresses/resolve');
      expect(request?.headers.get('Accept-Language')).toBe(language);
      await user.clear(screen.getByLabelText(words.form.fields.street));
      await user.type(screen.getByLabelText(words.form.fields.street), 'Corrected Street');
      expect(screen.getByLabelText(words.form.fields.street)).toHaveValue('Corrected Street');
    },
  );

  it('preserves customer typing during lookup and submits the filled details with the pin', async () => {
    const user = userEvent.setup();
    const { api } = await renderAddresses({
      routes: {
        'GET /addresses/resolve': { body: { data: suggestion } },
        'POST /addresses': { status: 201, body: { data: homeAddress } },
      },
    });
    await screen.findByRole('heading', { level: 1, name: 'New address' });
    await user.click(await screen.findByRole('button', { name: 'Tap the map in Riyadh' }));
    expect(screen.getByRole('button', { name: 'Save address' })).toBeDisabled();
    await user.type(screen.getByLabelText('Street'), 'Manual street');
    await waitForAddressLookup();
    expect(screen.getByLabelText('Street')).toHaveValue('Manual street');
    await user.type(screen.getByLabelText('Additional number'), '5678');
    await user.click(screen.getByRole('button', { name: 'Save address' }));
    await screen.findByRole('heading', { name: 'Address saved' });
    expect(api.calls().find((call) => call.method === 'POST')?.body).toMatchObject({
      city: 'Riyadh',
      street: 'Manual street',
      building_number: '1234',
      additional_number: '5678',
      postal_code: '12211',
      lat: 24.7136,
      lng: 46.6753,
    });
  });

  it('replaces old location details and clears unavailable numbers after the pin moves', async () => {
    const user = userEvent.setup();
    await renderAddresses({
      routes: {
        'GET /addresses/resolve': ({ query }) => ({
          body: {
            data:
              Number(query.get('lat')) > 23
                ? suggestion
                : {
                    ...suggestion,
                    city: 'Jeddah',
                    street: null,
                    building_number: null,
                    postal_code: null,
                  },
          },
        }),
      },
    });
    await screen.findByRole('heading', { level: 1, name: 'New address' });
    await user.click(await screen.findByRole('button', { name: 'Tap the map in Riyadh' }));
    await waitForAddressLookup();
    await user.type(screen.getByLabelText('Additional number'), '5678');
    await user.type(screen.getByLabelText('Short address (optional)'), 'RRRD2929');
    await user.click(screen.getByRole('button', { name: 'Tap the map in Jeddah' }));
    expect(screen.getByLabelText('Street')).toHaveValue('');
    await waitForAddressLookup();
    expect(screen.getByLabelText('City')).toHaveValue('Jeddah');
    for (const label of [
      'Street',
      'Building number',
      'Postal code',
      'Additional number',
      'Short address (optional)',
    ]) {
      expect(screen.getByLabelText(label)).toHaveValue('');
    }
    expect(screen.getByLabelText('Recipient name')).toHaveValue('Sara');
  });

  it('shows manual fallback on failure and allows retry without replacing customer edits', async () => {
    const user = userEvent.setup();
    let calls = 0;
    await renderAddresses({
      routes: {
        'GET /addresses/resolve': () =>
          ++calls === 1 ? 'offline' : { body: { data: suggestion } },
      },
    });
    await screen.findByRole('heading', { level: 1, name: 'New address' });
    await user.click(await screen.findByRole('button', { name: 'Tap the map in Riyadh' }));
    await user.click(await screen.findByRole('button', { name: 'Try address lookup again' }));
    await user.type(screen.getByLabelText('City'), 'Manual city');
    await waitForAddressLookup();
    expect(screen.getByLabelText('City')).toHaveValue('Manual city');
    expect(screen.getByLabelText('Street')).toHaveValue('Test Street');
  });

  it('does not look up or replace a saved address when it is opened', async () => {
    const { api } = await renderAddresses({
      route: '/account/addresses/1',
      routes: {
        'GET /addresses/1': { body: { data: homeAddress } },
      },
    });
    expect(await screen.findByLabelText('City')).toHaveValue(homeAddress.city);
    expect(api.requests()).not.toContain('GET /addresses/resolve');
  });
});
