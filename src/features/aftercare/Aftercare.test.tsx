import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { caseFixture, careItemsFixture } from './testData';
const me = { 'GET /me': { body: { data: testUser } } };
const items = { 'GET /orders/order-a/care-items': { body: { data: { items: careItemsFixture } } } };

describe('Customer support and returns', () => {
  it('saves the exact delivered item and return quantity, then opens the request', async () => {
    const user = userEvent.setup();
    const api = installFakeApi({
      ...me,
      ...items,
      'POST /orders/order-a/cases': {
        status: 201,
        body: { data: { ...caseFixture, kind: 'return', order_item_id: 7, quantity: 1 } },
      },
      'GET /me/cases/case-a': { body: { data: caseFixture } },
    });
    await renderApp({ route: '/orders/order-a/help', signedIn: true, seenWelcome: true });
    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Request type' }),
      'return',
    );
    await user.selectOptions(screen.getByRole('combobox', { name: 'Delivered item' }), '7');
    await user.type(screen.getByLabelText('Reason or subject'), 'Wrong size');
    await user.type(screen.getByLabelText('Describe what happened'), 'The size does not fit.');
    expect(screen.getByText(/does not confirm a refund/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    await screen.findByRole('heading', { name: 'Request details', level: 1 });
    expect(api.calls().find((r) => r.method === 'POST')?.body).toMatchObject({
      kind: 'return',
      subject: 'Wrong size',
      message: 'The size does not fit.',
      order_item_id: 7,
      quantity: 1,
    });
  });
  it('keeps the same request key when a lost response is retried', async () => {
    const user = userEvent.setup();
    const api = installFakeApi({ ...me, ...items, 'POST /orders/order-a/cases': 'offline' });
    await renderApp({ route: '/orders/order-a/help', signedIn: true, seenWelcome: true });
    await user.type(await screen.findByLabelText('Reason or subject'), 'Late delivery');
    await user.type(screen.getByLabelText('Describe what happened'), 'Please check.');
    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    await waitFor(() => {
      expect(api.calls().filter((r) => r.method === 'POST')).toHaveLength(2);
    });
    const posts = api.calls().filter((r) => r.method === 'POST');
    expect(posts[0]?.body).toEqual(posts[1]?.body);
    expect(screen.getByLabelText('Reason or subject')).toHaveValue('Late delivery');
  });
  it('does not offer undelivered/fully requested items and blocks return submission', async () => {
    const user = userEvent.setup();
    installFakeApi({
      ...me,
      'GET /orders/order-a/care-items': {
        body: { data: { items: [{ ...careItemsFixture[0], returnable_quantity: 0 }] } },
      },
    });
    await renderApp({ route: '/orders/order-a/help', signedIn: true, seenWelcome: true });
    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Request type' }),
      'return',
    );
    expect(screen.getByText(/no delivered items available/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit request' })).toBeDisabled();
    expect(screen.queryByRole('option', { name: /T-shirt/ })).not.toBeInTheDocument();
  });
  it('sends follow-up messages without closing or resolving the request', async () => {
    const user = userEvent.setup();
    const api = installFakeApi({
      ...me,
      'GET /me/cases/case-a': { body: { data: caseFixture } },
      'POST /me/cases/case-a/messages': {
        body: {
          data: {
            ...caseFixture,
            messages: [
              ...caseFixture.messages,
              {
                id: 2,
                author: 'customer',
                body: 'Any update?',
                created_at: caseFixture.created_at,
              },
            ],
          },
        },
      },
    });
    await renderApp({ route: '/account/support/case-a', signedIn: true, seenWelcome: true });
    await user.type(await screen.findByLabelText('Describe what happened'), 'Any update?');
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByText('Any update?')).toBeInTheDocument();
    expect(api.calls().find((r) => r.method === 'POST')?.body).toEqual({ message: 'Any update?' });
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });
  it('shows a closed Arabic conversation without a follow-up form', async () => {
    installFakeApi({
      ...me,
      'GET /me/cases/case-a': { body: { data: { ...caseFixture, status: 'resolved' } } },
    });
    await renderApp({
      route: '/account/support/case-a',
      signedIn: true,
      seenWelcome: true,
      language: 'ar',
    });
    expect(await screen.findByText('تم الحل')).toBeInTheDocument();
    expect(screen.getByText(/هذا الطلب مغلق/)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
  });
  it('shows an empty requests list with a route to orders', async () => {
    installFakeApi({
      ...me,
      'GET /me/cases': { body: { data: [], links: { next: null }, meta: { next_cursor: null } } },
    });
    await renderApp({ route: '/account/support', signedIn: true, seenWelcome: true });
    expect(await screen.findByText('No requests yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Choose an order' })).toHaveAttribute(
      'href',
      '/orders',
    );
  });
  it('requires authentication for support routes', async () => {
    installFakeApi({});
    const { router } = await renderApp({ route: '/account/support', seenWelcome: true });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/sign-in');
    });
  });
});
