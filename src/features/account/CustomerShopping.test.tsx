import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';
import { customer } from './testData';

const individual = {
  buyer_type: 'individual',
  company_name: null,
  registration_number: null,
  vat_number: null,
  billing_address: null,
};
const page = { data: [], links: { next: null, prev: null }, meta: {} };
describe('Saudi customer additions', () => {
  it('saves company billing details through the authenticated account endpoint', async () => {
    const api = installFakeApi({
      'GET /me': { body: { data: customer } },
      'GET /me/billing-profile': { body: { data: individual } },
      'PUT /me/billing-profile': ({ body }) => ({ body: { data: body } }),
    });
    const user = userEvent.setup();
    await renderApp({
      route: '/account/billing',
      signedIn: true,
      language: 'en',
      seenWelcome: true,
    });
    await user.selectOptions(await screen.findByLabelText('I am shopping as'), 'business');
    await user.type(screen.getByLabelText('Legal company name'), 'Riyadh Supplies');
    await user.type(screen.getByLabelText('VAT number (if registered)'), '300000000000003');
    await user.type(screen.getByLabelText('Company billing address'), 'Riyadh, Building 1234');
    await user.click(screen.getByRole('button', { name: 'Save details' }));
    expect(await screen.findByText('Details saved')).toBeVisible();
    expect(api.calls().find((call) => call.method === 'PUT')?.body).toEqual({
      buyer_type: 'business',
      company_name: 'Riyadh Supplies',
      registration_number: null,
      vat_number: '300000000000003',
      billing_address: 'Riyadh, Building 1234',
    });
  });

  it('shows company billing in Arabic and offers individual/company choices', async () => {
    installFakeApi({
      'GET /me': { body: { data: customer } },
      'GET /me/billing-profile': { body: { data: individual } },
    });
    const user = userEvent.setup();
    await renderApp({
      route: '/account/billing',
      signedIn: true,
      language: 'ar',
      seenWelcome: true,
    });
    await user.selectOptions(await screen.findByLabelText('أتسوق بصفتي'), 'business');
    expect(screen.getByLabelText('الاسم القانوني للشركة')).toBeVisible();
    expect(screen.getByLabelText('عنوان فوترة الشركة')).toBeRequired();
  });

  it('reuses the request reference after an unanswered quotation submission', async () => {
    let tries = 0;
    const api = installFakeApi({
      'GET /me': { body: { data: customer } },
      'GET /me/requests': { body: page },
      'POST /me/requests': ({ body }) => {
        tries++;
        return tries === 1 ? 'offline' : { body: { data: body } };
      },
    });
    const user = userEvent.setup();
    await renderApp({
      route: '/account/requests',
      signedIn: true,
      language: 'en',
      seenWelcome: true,
    });
    await user.type(await screen.findByLabelText('Subject'), '100 towels');
    await user.type(
      screen.getByLabelText('Details'),
      '100 cotton towels delivered to Riyadh next month.',
    );
    await user.click(screen.getByRole('button', { name: 'Send request' }));
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Send request' }));
    await screen.findByText('Request received');
    const posts = api.calls().filter((call) => call.method === 'POST');
    expect(posts).toHaveLength(2);
    expect(posts[0]?.body).toEqual(posts[1]?.body);
  });

  it('keeps account closure explicit and prevents guests reading private requests', async () => {
    installFakeApi();
    const { router } = await renderApp({
      route: '/account/requests',
      language: 'en',
      seenWelcome: true,
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/sign-in');
    });
  });
});
