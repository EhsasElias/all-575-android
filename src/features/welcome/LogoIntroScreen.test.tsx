import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { setReducedMotion } from '@/test/browserStubs';
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';

describe('Logo introduction', () => {
  it('shows only the logo transition between the slider and shop', async () => {
    const user = userEvent.setup();
    installFakeApi({});
    const { router } = await renderApp({ route: '/welcome', language: 'en' });
    const header = screen.getByRole('main').querySelector('header');
    if (header === null) throw new Error('Welcome header missing');
    await user.click(within(header).getByRole('button', { name: 'Tap the logo to shop now' }));
    expect(router.state.location.pathname).toBe('/welcome/logo');
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('Loading');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    await waitFor(
      () => {
        expect(router.state.location.pathname).toBe('/home');
      },
      { timeout: 3000 },
    );
  });

  it('still shows a brief logo screen when reduced motion is preferred', async () => {
    setReducedMotion(true);
    installFakeApi({});
    const { router } = await renderApp({ route: '/welcome/logo', seenWelcome: true });
    expect(router.state.location.pathname).toBe('/welcome/logo');
    await waitFor(
      () => {
        expect(router.state.location.pathname).toBe('/home');
      },
      { timeout: 3000 },
    );
  });
});
