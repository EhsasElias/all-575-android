import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { setReducedMotion } from '@/test/browserStubs';
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';

describe('Logo introduction', () => {
  it('shows a loading logo first, then the slider, then the requested shopping page', async () => {
    installFakeApi({});
    const { router } = await renderApp({ route: '/welcome/logo?next=%2Fcart', language: 'en' });
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('Loading');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    await waitFor(
      () => {
        expect(router.state.location.pathname).toBe('/welcome');
      },
      { timeout: 5000 },
    );
    expect(router.state.location.search).toBe('?next=%2Fcart');
    await screen.findByRole('heading', { level: 1, name: 'Welcome, our partner in success' });
    const header = screen.getByRole('main').querySelector('header');
    if (header === null) throw new Error('Welcome header missing');
    await userEvent
      .setup()
      .click(within(header).getByRole('button', { name: 'Tap the logo to shop now' }));
    expect(router.state.location.pathname).toBe('/home');
  });

  it('keeps the brief logo visible before the slider when reduced motion is preferred', async () => {
    setReducedMotion(true);
    installFakeApi({});
    const { router } = await renderApp({ route: '/welcome/logo', seenWelcome: true });
    expect(router.state.location.pathname).toBe('/welcome/logo');
    await waitFor(
      () => {
        expect(router.state.location.pathname).toBe('/welcome');
      },
      { timeout: 5000 },
    );
  });
});
