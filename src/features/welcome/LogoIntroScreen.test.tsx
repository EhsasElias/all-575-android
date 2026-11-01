import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { setReducedMotion } from '@/test/browserStubs';
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';

describe('Logo introduction', () => {
  it('shows the greeting and waits for a logo click before showing the slider', async () => {
    installFakeApi({});
    const { router } = await renderApp({ route: '/welcome/logo?next=%2Fcart', language: 'en' });
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome, our partner in success' })).toBeInTheDocument();
    const logo = screen.getByRole('button', { name: 'Tap the logo to shop now' });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(router.state.location.pathname).toBe('/welcome/logo');
    await userEvent.setup().click(logo);
    expect(router.state.location.pathname).toBe('/welcome');
    expect(router.state.location.search).toBe('?next=%2Fcart');
    expect(screen.queryByRole('heading', { name: 'Welcome, our partner in success' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByText('Shop by category')).toBeInTheDocument();
  });

  it('waits for a click even with reduced motion', async () => {
    setReducedMotion(true);
    installFakeApi({});
    const { router } = await renderApp({ route: '/welcome/logo', seenWelcome: true });
    expect(router.state.location.pathname).toBe('/welcome/logo');
    await userEvent.setup().click(screen.getByRole('button', { name: /Tap the logo/i }));
    expect(router.state.location.pathname).toBe('/welcome');
  });
});
