import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';

describe('Account tab login transition', () => {
  it('opens the guest account first and then offers sign-in without replaying the launch logo', async () => {
    installFakeApi({});
    const user = userEvent.setup();
    const { router } = await renderApp({ route: '/home', seenWelcome: true });

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    await user.click(within(nav).getByRole('link', { name: 'Account' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/account');
    });
    expect(router.state.location.search).toBe('');
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Tap the logo to shop now' }),
    ).not.toBeInTheDocument();

    const signIn = screen.getByRole('link', { name: /sign in/i });
    expect(signIn).toHaveAttribute('href', '/sign-in?next=%2Faccount');
    await user.click(signIn);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/sign-in');
    });
    expect(router.state.location.search).toBe('?next=%2Faccount');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible();
  });
});
