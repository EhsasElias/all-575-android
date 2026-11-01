import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';

describe('Account tab login transition', () => {
  it('shows the logo before login when a guest taps Account', async () => {
    installFakeApi({});
    const user = userEvent.setup();
    const { router } = await renderApp({ route: '/home', seenWelcome: true });

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    await user.click(within(nav).getByRole('link', { name: 'Account' }));

    expect(router.state.location.pathname).toBe('/welcome/logo');
    expect(router.state.location.search).toBe('?mode=account');
    const logo = within(screen.getByRole('main')).getByRole('button', { name: 'Tap the logo to shop now' });
    expect(logo).toBeVisible();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    await user.click(logo);

    await waitFor(
      () => {
        expect(router.state.location.pathname).toBe('/sign-in');
      },
      { timeout: 5000 },
    );
    expect(router.state.location.search).toBe('?next=%2Faccount');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible();
  });
});
