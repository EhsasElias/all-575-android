import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { ORDER_ID } from '../testData';
import { deliveredOrder } from '../testScenarios';
import { holdRequests } from '../testHelpers';
import { createdReview, openDelivered, rate } from './reviewTestSetup';

afterEach(() => {
  vi.useRealTimers();
});

describe('Rating a delivered item', () => {
  it('is offered only for delivered deliveries', async () => {
    installFakeApi({
      'GET /me': { body: { data: testUser } },
      'GET /orders/:id': {
        body: { data: { ...deliveredOrder(), status: 'confirmed' as const, suborders: [] } },
      },
    });
    await renderApp({ route: `/orders/${ORDER_ID}`, signedIn: true, seenWelcome: true });

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('group', { name: /Rate/ })).not.toBeInTheDocument();
  });

  it('offers one review for a product that appears on two lines (two variants)', async () => {
    const order = deliveredOrder();
    const suborder = order.suborders[0];
    const line = suborder?.items[0];
    if (suborder === undefined || line === undefined) throw new Error('Test data changed');
    const twoVariants = {
      ...order,
      suborders: [
        {
          ...suborder,
          items: [
            { ...line, variant_name: { ar: 'أزرق', en: 'Blue' } },
            { ...line, variant_name: { ar: 'أحمر', en: 'Red' } },
          ],
        },
      ],
    };
    await openDelivered({ 'GET /orders/:id': { body: { data: twoVariants } } });

    expect(await screen.findByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: 'Rate Cleaning Brush' })).toHaveLength(1);
  });

  it('sends the rating and comment, then shows them with the time left to edit', async () => {
    const user = userEvent.setup();
    const api = await openDelivered({
      'POST /orders/:id/reviews': () => ({
        status: 201,
        body: { data: createdReview({ rating: 4, body: 'Works well' }) },
      }),
    });

    expect(await screen.findByRole('group', { name: 'Rate Cleaning Brush' })).toBeInTheDocument();
    await user.click(await rate(4));
    await user.type(screen.getByLabelText('Comment (optional)'), 'Works well');
    await user.click(screen.getByRole('button', { name: 'Send review' }));

    expect(await screen.findByRole('img', { name: 'Rated 4 out of 5' })).toBeInTheDocument();
    expect(screen.getByText('Works well')).toBeInTheDocument();
    expect(
      screen.getByText(/You can edit this review until .* \(in 3 days\)\./),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit review' })).toBeInTheDocument();
    const post = api
      .calls()
      .find((call) => call.method === 'POST' && call.path.endsWith('/reviews'));
    expect(post?.path).toBe(`/orders/${ORDER_ID}/reviews`);
    expect(post?.body).toEqual({ product_slug: 'demo-cleaning-1', rating: 4, body: 'Works well' });
  });

  it('sends no comment as null', async () => {
    const user = userEvent.setup();
    const api = await openDelivered({
      'POST /orders/:id/reviews': {
        status: 201,
        body: { data: createdReview({ rating: 5, body: null }) },
      },
    });

    await user.click(await rate(5));
    await user.click(screen.getByRole('button', { name: 'Send review' }));

    await screen.findByRole('img', { name: 'Rated 5 out of 5' });
    const post = api.calls().find((call) => call.method === 'POST');
    expect(post?.body).toEqual({ product_slug: 'demo-cleaning-1', rating: 5, body: null });
  });

  it('asks for a rating before sending anything', async () => {
    const user = userEvent.setup();
    const api = await openDelivered();

    await user.click(await screen.findByRole('button', { name: 'Send review' }));

    expect(await screen.findByText('Choose a rating from 1 to 5 stars.')).toBeInTheDocument();
    expect(api.requests().some((request) => request.startsWith('POST'))).toBe(false);
  });

  it('limits the comment to 1000 characters', async () => {
    await openDelivered();

    expect(await screen.findByLabelText('Comment (optional)')).toHaveAttribute('maxlength', '1000');
  });

  it('sends only one request when the button is pressed twice', async () => {
    const user = userEvent.setup();
    const api = await openDelivered({
      'POST /orders/:id/reviews': { status: 201, body: { data: createdReview() } },
    });
    const gate = holdRequests('/reviews');

    await user.click(await rate(3));
    const send = screen.getByRole('button', { name: 'Send review' });
    await user.click(send);
    await user.click(send);
    gate.release();

    await screen.findByRole('img', { name: 'Rated 4 out of 5' });
    expect(api.requests().filter((request) => request.startsWith('POST'))).toHaveLength(1);
  });
});

describe('The star rating is a keyboard-operable radio group', () => {
  it('moves the choice with the arrow keys', async () => {
    const user = userEvent.setup();
    await openDelivered();
    const first = await rate(1);

    act(() => {
      first.focus();
    });
    await user.keyboard('{ArrowRight}');
    expect(await rate(2)).toBeChecked();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(await rate(4)).toBeChecked();
    await user.keyboard('{ArrowLeft}');
    expect(await rate(3)).toBeChecked();
    expect(screen.getAllByRole('radio', { name: /Rate \d out of 5/ })).toHaveLength(5);
  });

  it('is named by the item and tells screen readers the rating of each star', async () => {
    await openDelivered();

    const group = within(await screen.findByRole('group', { name: 'Rate Cleaning Brush' }));
    expect(group.getAllByRole('radio').map((radio) => radio.getAttribute('type'))).toEqual(
      Array(5).fill('radio'),
    );
    expect(group.getByRole('radio', { name: 'Rate 1 out of 5' })).toBeInTheDocument();
  });
});
