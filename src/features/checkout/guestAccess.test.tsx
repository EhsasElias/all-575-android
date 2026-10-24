import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';

describe('Checkout, payment and addresses need an account', () => {
  it.each([
    ['/checkout', '%2Fcheckout'],
    [
      '/checkout/payment/01m5qes24fbpdaqq84m8g3yzvh',
      '%2Fcheckout%2Fpayment%2F01m5qes24fbpdaqq84m8g3yzvh',
    ],
    ['/account/addresses', '%2Faccount%2Faddresses'],
    ['/account/addresses/new', '%2Faccount%2Faddresses%2Fnew'],
    ['/account/addresses/1', '%2Faccount%2Faddresses%2F1'],
  ])('sends a guest from %s to sign in and brings them back afterwards', async (route, next) => {
    const api = installFakeApi();

    const { router } = await renderApp({ route, seenWelcome: true });

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/sign-in');
    expect(router.state.location.search).toBe(`?next=${next}`);
    // Nothing about the customer's addresses, cart or orders is asked for.
    expect(
      api.requests().some((request) => /addresses|quotes|checkout|payments|orders/.test(request)),
    ).toBe(false);
  });
});
