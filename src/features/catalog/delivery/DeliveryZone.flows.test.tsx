import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPreference, setPreference } from '@/shared/storage';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { installCatalogApi, queriesOf } from '../testApi';
import { fixAt, getPosition } from '../testGeolocation';
import { defaultAddress, makeProduct, page, riyadh } from '../testData';

vi.mock('@capacitor/geolocation', async () => ({
  Geolocation: { getCurrentPosition: (await import('../testGeolocation')).getPosition },
}));

const inRiyadh = { body: { data: { serviceable: true, zone: riyadh } } };
const nowhere = { body: { data: { serviceable: false, zone: null } } };

function locationWill(result: 'work' | { code: number | string }) {
  if (result === 'work') getPosition.mockResolvedValue(fixAt(24.71, 46.67));
  else getPosition.mockRejectedValue(result);
  return getPosition;
}

async function openSheet(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Choose your delivery area|Deliver to/ }));
  return screen.findByRole('dialog', { name: 'Delivery area' });
}

describe('Delivery area chip', () => {
  beforeEach(() => {
    getPosition.mockReset();
  });

  it('asks nothing of the device until the customer taps the button', async () => {
    const getPosition = locationWill('work');
    installCatalogApi();
    const user = userEvent.setup();
    await renderApp({ route: '/home', seenWelcome: true });
    await openSheet(user);

    expect(getPosition).not.toHaveBeenCalled();
    expect(screen.getByText(/do not store it/)).toBeVisible();
  });

  it('finds the area from the current location, saves it and shows availability for it', async () => {
    const getPosition = locationWill('work');
    const api = installCatalogApi({
      'GET /zones/resolve': inRiyadh,
      'GET /products': ({ query }) => ({
        body: page([makeProduct({ availability: query.has('zone_id') ? 'in_stock' : 'unknown' })]),
      }),
    });
    const user = userEvent.setup();
    await renderApp({ route: '/home', seenWelcome: true });
    const sheet = await openSheet(user);

    await user.click(within(sheet).getByRole('button', { name: 'Use my current location' }));

    expect(await screen.findByRole('button', { name: /Deliver to\s*Riyadh/ })).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(getPosition).toHaveBeenCalledTimes(1);
    expect(queriesOf(api, 'GET /zones/resolve')[0]?.toString()).toBe('lat=24.71&lng=46.67');
    expect(JSON.parse(getPreference('deliveryZone') ?? 'null')).toEqual({
      id: 1,
      name: { ar: 'الرياض', en: 'Riyadh' },
    });
    // The products are asked for again, now for the zone, and say what is in stock there.
    expect(await screen.findByText('In stock')).toBeVisible();
    expect(queriesOf(api, 'GET /products').at(-1)?.get('zone_id')).toBe('1');
    expect(await screen.findByText('Delivering to Riyadh')).toBeVisible();
  });

  it('keeps no coordinates anywhere', async () => {
    locationWill('work');
    installCatalogApi({ 'GET /zones/resolve': inRiyadh });
    const user = userEvent.setup();
    await renderApp({ route: '/home', seenWelcome: true });
    const sheet = await openSheet(user);

    await user.click(within(sheet).getByRole('button', { name: 'Use my current location' }));
    await screen.findByRole('button', { name: /Deliver to\s*Riyadh/ });

    expect(getPreference('deliveryZone')).not.toMatch(/24\.71|46\.67/);
  });

  it('says honestly when we do not deliver there, and changes nothing', async () => {
    locationWill('work');
    installCatalogApi({ 'GET /zones/resolve': nowhere });
    const user = userEvent.setup();
    await renderApp({ route: '/home', seenWelcome: true });
    const sheet = await openSheet(user);

    await user.click(within(sheet).getByRole('button', { name: 'Use my current location' }));

    expect(await within(sheet).findByText(/We do not deliver to your location yet/)).toBeVisible();
    expect(getPreference('deliveryZone')).toBeNull();
    await user.click(within(sheet).getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('button', { name: 'Choose your delivery area' })).toBeVisible();
  });

  it.each([
    ['denied', { code: 1 }, /Location access is turned off/],
    ['denied on the phone', { code: 'OS-PLUG-GLOC-0003' }, /Location access is turned off/],
    ['unavailable', { code: 2 }, /We could not find your location/],
    ['timed out', { code: 3 }, /took too long/],
  ])(
    'explains it when the location is %s, and makes no request to the zone API',
    async (_label, failure, message) => {
      locationWill(failure);
      const api = installCatalogApi();
      const user = userEvent.setup();
      await renderApp({ route: '/home', seenWelcome: true });
      const sheet = await openSheet(user);

      await user.click(within(sheet).getByRole('button', { name: 'Use my current location' }));

      expect(await within(sheet).findByText(message)).toBeVisible();
      expect(api.requests()).not.toContain('GET /zones/resolve');
      expect(getPreference('deliveryZone')).toBeNull();
      // Browsing still works.
      expect(screen.getByRole('link', { name: 'Biscuits' })).toBeVisible();
    },
  );

  it('explains it when the zone check fails, and lets the customer try again', async () => {
    locationWill('work');
    let attempt = 0;
    installCatalogApi({
      'GET /zones/resolve': () => {
        attempt += 1;
        return attempt === 1 ? { status: 400, body: { message: 'Bad' } } : inRiyadh;
      },
    });
    const user = userEvent.setup();
    await renderApp({ route: '/home', seenWelcome: true });
    const sheet = await openSheet(user);

    await user.click(within(sheet).getByRole('button', { name: 'Use my current location' }));
    expect(await within(sheet).findByText(/We could not check your area/)).toBeVisible();

    await user.click(within(sheet).getByRole('button', { name: 'Use my current location' }));
    expect(await screen.findByRole('button', { name: /Deliver to\s*Riyadh/ })).toBeVisible();
  });

  it('offers the saved addresses as another way to set the area', async () => {
    installCatalogApi();
    const user = userEvent.setup();
    const { router } = await renderApp({ route: '/home', seenWelcome: true });
    const sheet = await openSheet(user);

    await user.click(within(sheet).getByRole('link', { name: 'Manage my addresses' }));

    // A guest is sent to sign in first, and brought back afterwards.
    expect(router.state.location.pathname).toBe('/sign-in');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uses the area saved on this device, in the language of the screen', async () => {
    installCatalogApi();
    const { router } = await renderApp({ route: '/categories', seenWelcome: true, language: 'ar' });
    setPreference('deliveryZone', JSON.stringify({ id: 1, name: riyadh.name }));

    await act(async () => {
      await router.navigate('/home');
    });

    expect(await screen.findByRole('button', { name: /التوصيل إلى\s*الرياض/ })).toBeVisible();
  });

  it('asks for products in the saved area from the first request', async () => {
    const api = installCatalogApi();
    const { router } = await renderApp({ route: '/categories', seenWelcome: true });
    setPreference('deliveryZone', JSON.stringify({ id: 1, name: riyadh.name }));

    await act(async () => {
      await router.navigate('/home');
    });
    await screen.findByRole('link', { name: 'Biscuits' });

    expect(queriesOf(api, 'GET /products').map((query) => query.get('zone_id'))).toEqual(['1']);
  });

  it('ignores a saved value that is not a zone', async () => {
    installCatalogApi();
    const { router } = await renderApp({ route: '/categories', seenWelcome: true });
    setPreference('deliveryZone', '{"id":"abc","name":1}');

    await act(async () => {
      await router.navigate('/home');
    });

    expect(await screen.findByRole('button', { name: 'Choose your delivery area' })).toBeVisible();
  });
});

describe('Delivery area of a signed-in customer', () => {
  beforeEach(() => {
    getPosition.mockReset();
  });

  const signedIn = (routes = {}) =>
    installCatalogApi({
      'GET /me': { body: { data: testUser } },
      'GET /addresses': {
        body: { data: [{ ...defaultAddress, is_default: false, id: 9 }, defaultAddress] },
      },
      'GET /zones/resolve': inRiyadh,
      ...routes,
    });

  it('follows the zone of the default address', async () => {
    const api = signedIn();
    const user = userEvent.setup();
    await renderApp({ route: '/home', seenWelcome: true, signedIn: true });

    expect(await screen.findByRole('button', { name: /Deliver to\s*Riyadh/ })).toBeVisible();
    expect(queriesOf(api, 'GET /zones/resolve')[0]?.toString()).toBe('lat=24.71&lng=46.67');
    await waitFor(() => {
      expect(queriesOf(api, 'GET /products').at(-1)?.get('zone_id')).toBe('1');
    });

    const sheet = await openSheet(user);
    expect(within(sheet).getByText(/area of your default address/)).toBeVisible();
    expect(within(sheet).queryByRole('button', { name: 'Use my current location' })).toBeNull();
    // Remembered, so the next start does not wait for the network.
    expect(JSON.parse(getPreference('deliveryZone') ?? 'null')).toEqual({
      id: 1,
      name: riyadh.name,
    });
  });

  it('does not use an address we cannot deliver to', async () => {
    signedIn({
      'GET /addresses': {
        body: { data: [{ ...defaultAddress, serviceable: false, service_zone_id: null }] },
      },
    });
    await renderApp({ route: '/home', seenWelcome: true, signedIn: true });

    expect(await screen.findByRole('button', { name: 'Choose your delivery area' })).toBeVisible();
  });

  it('ignores a failing address request: browsing and choosing an area still work', async () => {
    const api = signedIn({ 'GET /addresses': { status: 500, body: { message: 'Boom' } } });
    await renderApp({ route: '/home', seenWelcome: true, signedIn: true });

    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeVisible();
    await waitFor(() => {
      expect(api.requests()).toContain('GET /addresses');
    });
    expect(screen.getByRole('button', { name: 'Choose your delivery area' })).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not ask for addresses when nobody is signed in', async () => {
    const api = signedIn();
    await renderApp({ route: '/home', seenWelcome: true });
    await screen.findByRole('link', { name: 'Biscuits' });

    expect(api.requests()).not.toContain('GET /addresses');
  });
});
