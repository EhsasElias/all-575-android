import type { Language } from '@/shared/i18n';
import { installFakeApi, type FakeRoutes } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { forgetPaymentActions } from './paymentHandoff';
import { home, jeddah, oneLineCart, quote, riyadhZone, slots, work } from './testData';

type Options = { route?: string; language?: Language; routes?: FakeRoutes };

/**
 * The whole app on a checkout route, signed in, against a server where the customer has a one-line cart,
 * a default Riyadh address, two more addresses and open delivery times. `routes` overrides any of it.
 */
export async function renderCheckout({
  route = '/checkout',
  language = 'en',
  routes = {},
}: Options = {}) {
  forgetPaymentActions();
  const api = installFakeApi({
    'GET /me': { body: { data: testUser } },
    'GET /cart': { body: oneLineCart },
    'GET /addresses': { body: { data: [home, work, jeddah] } },
    'GET /delivery/slots': { body: { data: slots } },
    'GET /zones/resolve': { body: { data: { serviceable: true, zone: riyadhZone } } },
    'POST /quotes': () => ({ status: 201, body: { data: quote() } }),
    ...routes,
  });
  const app = await renderApp({ route, signedIn: true, seenWelcome: true, language });
  return { api, ...app };
}
