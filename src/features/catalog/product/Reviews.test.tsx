import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render';
import { installProductApi, queriesOf } from '../testApi';
import { makeReview, page } from '../testData';

function renderProduct() {
  return renderApp({ route: '/products/demo-food-1', seenWelcome: true });
}

describe('Reviews', () => {
  it('lists reviews with stars, a masked name, the date and the text', async () => {
    installProductApi(undefined, {
      'GET /products/:slug/reviews': {
        body: page([
          makeReview(),
          makeReview({ id: 2, rating: 2, reviewer: null, body: null, created_at: null }),
        ]),
      },
    });
    await renderProduct();

    const section = await screen.findByRole('region', { name: 'Reviews' });
    expect(await within(section).findByText('Fresh and crunchy.')).toBeVisible();
    expect(within(section).getByText('S*** A.')).toBeVisible();
    expect(within(section).getByRole('img', { name: 'Rated 4 out of 5' })).toBeVisible();
    expect(within(section).getByRole('img', { name: 'Rated 2 out of 5' })).toBeVisible();
    expect(within(section).getByText('A customer')).toBeVisible();
    expect(within(section).getByText(/20 Oct 2026|Oct 20, 2026/)).toBeVisible();
  });

  it('shows review text as plain text', async () => {
    installProductApi(undefined, {
      'GET /products/:slug/reviews': { body: page([makeReview({ body: '<script>x()</script>' })]) },
    });
    await renderProduct();

    expect(await screen.findByText('<script>x()</script>')).toBeVisible();
  });

  it('says there are no reviews yet', async () => {
    installProductApi();
    await renderProduct();

    expect(await screen.findByRole('heading', { name: 'No reviews yet' })).toBeVisible();
  });

  it('pages through reviews', async () => {
    const api = installProductApi(undefined, {
      'GET /products/:slug/reviews': ({ query }) => ({
        body:
          query.get('cursor') === 'r2'
            ? page([makeReview({ id: 2, body: 'Second page review' })])
            : page([makeReview()], 'http://api.test/api/v1/products/demo-food-1/reviews?cursor=r2'),
      }),
    });
    const user = userEvent.setup();
    await renderProduct();

    const section = await screen.findByRole('region', { name: 'Reviews' });
    await user.click(await within(section).findByRole('button', { name: 'Load more' }));

    expect(await within(section).findByText('Second page review')).toBeVisible();
    expect(within(section).getByText('Fresh and crunchy.')).toBeVisible();
    expect(queriesOf(api, 'GET /products/demo-food-1/reviews')[1]?.get('cursor')).toBe('r2');
  });

  it('shows an error for the reviews with a retry, while the product stays usable', async () => {
    let attempt = 0;
    installProductApi(undefined, {
      'GET /products/:slug/reviews': () => {
        attempt += 1;
        return attempt === 1
          ? { status: 400, body: { message: 'x' } }
          : { body: page([makeReview()]) };
      },
    });
    const user = userEvent.setup();
    await renderProduct();

    const section = await screen.findByRole('region', { name: 'Reviews' });
    expect(await within(section).findByText('We could not load the reviews')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1, name: 'Biscuits' })).toBeVisible();

    await user.click(within(section).getByRole('button', { name: 'Try again' }));
    expect(await within(section).findByText('Fresh and crunchy.')).toBeVisible();
  });
});
