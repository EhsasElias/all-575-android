import { installFakeApi, type FakeRoutes } from '@/test/fakeApi';
import { testStore } from '@/test/fixtures';
import { biscuits, categories, makeProductDetail, notebook, page, socks } from './testData';
import type { ProductDetail } from './api/types';

/** The server as a guest sees the catalog: store info, categories and one page of products. Override per test. */
export function installCatalogApi(routes: FakeRoutes = {}) {
  return installFakeApi({
    'GET /store': { body: { data: testStore } },
    'GET /categories': { body: { data: categories } },
    'GET /products': { body: page([biscuits, socks, notebook]) },
    ...routes,
  });
}

/** The requests made to one path, as their query strings. */
export function queriesOf(
  api: ReturnType<typeof installFakeApi>,
  request: string,
): URLSearchParams[] {
  const [method = '', path = ''] = request.split(' ');
  return api
    .calls()
    .filter((call) => call.method === method && call.path === path)
    .map((call) => call.query);
}

/** The catalog plus one product page: the product (any slug), and its reviews (none by default). */
export function installProductApi(
  detail: ProductDetail = makeProductDetail(),
  routes: FakeRoutes = {},
) {
  return installCatalogApi({
    'GET /products/:slug': { body: { data: detail } },
    'GET /products/:slug/reviews': { body: page([]) },
    ...routes,
  });
}
