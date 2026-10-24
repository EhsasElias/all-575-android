import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import type { Language } from '@/shared/i18n';
import { installFakeApi, type FakeRoutes } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { outsideZone, riyadhZone } from './testData';

export const NEW_ADDRESS_ROUTE = '/account/addresses/new';

type Options = { route?: string; language?: Language; routes?: FakeRoutes };

/** The whole app on an address route, signed in, with the zone check answering by latitude (Riyadh yes, Jeddah no). */
export async function renderAddresses({
  route = NEW_ADDRESS_ROUTE,
  language = 'en',
  routes = {},
}: Options = {}) {
  const api = installFakeApi({
    'GET /me': { body: { data: testUser } },
    'GET /zones/resolve': ({ query }) => ({
      body: { data: Number(query.get('lat')) > 23 ? riyadhZone : outsideZone },
    }),
    ...routes,
  });
  const app = await renderApp({ route, signedIn: true, seenWelcome: true, language });
  return { api, ...app };
}

/** Types into every required National Address field (the recipient is prefilled from the account). */
export async function fillNationalAddress(user: UserEvent) {
  await user.type(screen.getByLabelText('Region'), 'Riyadh');
  await user.type(screen.getByLabelText('City'), 'Riyadh');
  await user.type(screen.getByLabelText('District'), 'Al Olaya');
  await user.type(screen.getByLabelText('Street'), 'King Fahd Rd');
  await user.type(screen.getByLabelText('Building number'), '1234');
  await user.type(screen.getByLabelText('Additional number'), '5678');
  await user.type(screen.getByLabelText('Postal code'), '12211');
}

export const PIN_TEXT = (lat: number, lng: number) => `${lat},${lng}`;
