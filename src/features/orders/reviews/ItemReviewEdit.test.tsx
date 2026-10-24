import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildReview } from '../testData';
import { createdReview, openDelivered, rate } from './reviewTestSetup';

afterEach(() => {
  vi.useRealTimers();
});

describe('Editing a review inside its window', () => {
  it('changes the rating and comment with PATCH /reviews/{id}', async () => {
    const user = userEvent.setup();
    const api = await openDelivered({
      'POST /orders/:id/reviews': {
        status: 201,
        body: { data: createdReview({ rating: 3, body: 'OK' }) },
      },
      'PATCH /reviews/:id': {
        body: { data: createdReview({ rating: 5, body: 'Much better after a week' }) },
      },
    });
    await user.click(await rate(3));
    await user.type(screen.getByLabelText('Comment (optional)'), 'OK');
    await user.click(screen.getByRole('button', { name: 'Send review' }));
    await user.click(await screen.findByRole('button', { name: 'Edit review' }));

    expect(await rate(3)).toBeChecked();
    expect(screen.getByLabelText('Comment (optional)')).toHaveValue('OK');
    await user.click(await rate(5));
    await user.clear(screen.getByLabelText('Comment (optional)'));
    await user.type(screen.getByLabelText('Comment (optional)'), 'Much better after a week');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('img', { name: 'Rated 5 out of 5' })).toBeInTheDocument();
    expect(screen.getByText('Much better after a week')).toBeInTheDocument();
    const patch = api.calls().find((call) => call.method === 'PATCH');
    expect(patch?.path).toBe('/reviews/55');
    expect(patch?.body).toEqual({ rating: 5, body: 'Much better after a week' });
  });

  it('can be abandoned without sending anything', async () => {
    const user = userEvent.setup();
    const api = await openDelivered({
      'POST /orders/:id/reviews': { status: 201, body: { data: createdReview({ rating: 3 }) } },
    });
    await user.click(await rate(3));
    await user.click(screen.getByRole('button', { name: 'Send review' }));
    await user.click(await screen.findByRole('button', { name: 'Edit review' }));

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('img', { name: 'Rated 3 out of 5' })).toBeInTheDocument();
    expect(api.requests().some((request) => request.startsWith('PATCH'))).toBe(false);
  });

  it('closes the edit button once the window has passed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await openDelivered({
      'POST /orders/:id/reviews': {
        status: 201,
        body: {
          data: buildReview({ editable_until: new Date(Date.now() + 90_000).toISOString() }),
        },
      },
    });
    await user.click(await rate(4));
    await user.click(screen.getByRole('button', { name: 'Send review' }));
    expect(await screen.findByRole('button', { name: 'Edit review' })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3 * 60_000);
    });

    expect(screen.queryByRole('button', { name: 'Edit review' })).not.toBeInTheDocument();
    expect(screen.getByText('The time to edit this review has passed.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Rated 4 out of 5' })).toBeInTheDocument();
  });
});

describe('Refusals', () => {
  it('review_not_allowed: says the item must be delivered first and keeps the form', async () => {
    const user = userEvent.setup();
    await openDelivered({
      'POST /orders/:id/reviews': {
        status: 422,
        body: {
          message: 'You can review a product after it has been delivered.',
          code: 'review_not_allowed',
        },
      },
    });

    await user.click(await rate(4));
    await user.click(screen.getByRole('button', { name: 'Send review' }));

    expect(
      await screen.findByText('You can review an item only after it is delivered.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/after it has been delivered\./)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send review' })).toBeInTheDocument();
  });

  it('review_exists: thanks the customer and links to the product instead of showing a form', async () => {
    const user = userEvent.setup();
    await openDelivered({
      'POST /orders/:id/reviews': {
        status: 409,
        body: {
          message: 'You already reviewed this product for this order.',
          code: 'review_exists',
        },
      },
    });

    await user.click(await rate(4));
    await user.click(screen.getByRole('button', { name: 'Send review' }));

    expect(
      await screen.findByText('You already reviewed this item. Thank you!'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See it on the product page' })).toHaveAttribute(
      'href',
      '/products/demo-cleaning-1',
    );
    expect(screen.queryByRole('button', { name: 'Send review' })).not.toBeInTheDocument();
  });

  it('review_window_closed: stops offering edits and explains', async () => {
    const user = userEvent.setup();
    await openDelivered({
      'POST /orders/:id/reviews': { status: 201, body: { data: createdReview({ rating: 3 }) } },
      'PATCH /reviews/:id': {
        status: 409,
        body: { message: 'This review can no longer be edited.', code: 'review_window_closed' },
      },
    });
    await user.click(await rate(3));
    await user.click(screen.getByRole('button', { name: 'Send review' }));
    await user.click(await screen.findByRole('button', { name: 'Edit review' }));
    await user.click(await rate(5));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The time to edit this review has passed.',
    );
    expect(screen.queryByRole('button', { name: 'Edit review' })).not.toBeInTheDocument();
    expect(screen.queryByText('This review can no longer be edited.')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Rated 3 out of 5' })).toBeInTheDocument();
  });

  it('a 422 from the server asks the customer to check the rating and comment', async () => {
    const user = userEvent.setup();
    await openDelivered({
      'POST /orders/:id/reviews': {
        status: 422,
        body: {
          message: 'The body field must not be greater than 1000 characters.',
          errors: { body: ['too long'] },
        },
      },
    });

    await user.click(await rate(4));
    await user.click(screen.getByRole('button', { name: 'Send review' }));

    expect(
      await screen.findByText('Check your rating and comment, then try again.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/must not be greater/)).not.toBeInTheDocument();
  });

  it('shows a general message when the request fails', async () => {
    const user = userEvent.setup();
    await openDelivered({
      'POST /orders/:id/reviews': { status: 429, body: { message: 'Slow down' } },
    });

    await user.click(await rate(4));
    await user.click(screen.getByRole('button', { name: 'Send review' }));

    expect(await screen.findByText(/We could not save your review/)).toBeInTheDocument();
  });
});

describe('Reviews in Arabic', () => {
  it('reads right to left with its own wording', async () => {
    const user = userEvent.setup();
    await openDelivered(
      {
        'POST /orders/:id/reviews': {
          status: 201,
          body: { data: createdReview({ rating: 5, body: 'ممتاز' }) },
        },
      },
      'ar',
    );

    expect(await screen.findByRole('group', { name: 'قيّم فرشاة تنظيف' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'التقييم 5 من 5' }));
    await user.type(screen.getByLabelText('تعليق (اختياري)'), 'ممتاز');
    await user.click(screen.getByRole('button', { name: 'إرسال التقييم' }));

    expect(await screen.findByRole('img', { name: 'التقييم 5 من 5' })).toBeInTheDocument();
    expect(
      screen.getByText(/يمكنك تعديل هذا التقييم حتى .* \(خلال 3 أيام\)\./),
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });
});
