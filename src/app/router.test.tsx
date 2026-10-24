import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render';

const TAB_BAR = { name: 'Main navigation' };

describe('first launch', () => {
  it('opens the welcome screen on a fresh install', async () => {
    const { router } = await renderApp({ route: '/', seenWelcome: false });

    expect(router.state.location.pathname).toBe('/welcome');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome, our partner');
  });

  it('opens the shopping home for a returning user', async () => {
    const { router } = await renderApp({ route: '/', seenWelcome: true });

    expect(router.state.location.pathname).toBe('/home');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Products are on the way' }),
    ).toBeInTheDocument();
  });
});

describe('app shell', () => {
  it('shows the top bar logo and the tab bar on a tab screen', async () => {
    await renderApp({ route: '/home', seenWelcome: true });

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ALL 5.75' })).toHaveAttribute('href', '/home');
    expect(screen.getByRole('navigation', TAB_BAR)).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', TAB_BAR)).getAllByRole('link')).toHaveLength(5);
  });

  it('moves between tabs and marks the current one', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp({ route: '/home', seenWelcome: true });
    const tabs = within(screen.getByRole('navigation', TAB_BAR));

    await user.click(tabs.getByRole('link', { name: 'Cart' }));

    expect(router.state.location.pathname).toBe('/cart');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Your cart is empty' }),
    ).toBeInTheDocument();
    expect(tabs.getByRole('link', { name: 'Cart' })).toHaveAttribute('aria-current', 'page');
    expect(tabs.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it.each([
    ['/categories', 'No categories to show yet'],
    ['/cart', 'Your cart is empty'],
    ['/account', 'Sign in to manage your account'],
    ['/sign-in', 'Sign-in is not available yet'],
  ])('%s shows an empty state with a next step', async (route, title) => {
    await renderApp({ route, seenWelcome: true });

    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(within(main).getAllByRole('link')).toHaveLength(1);
  });

  it.each(['/checkout', '/orders'])(
    '%s needs an account: a guest is sent to sign in and brought back afterwards',
    async (route) => {
      const { router } = await renderApp({ route, seenWelcome: true });

      expect(router.state.location.pathname).toBe('/sign-in');
      expect(router.state.location.search).toBe(`?next=${encodeURIComponent(route)}`);
    },
  );

  it('says the page is missing for an unknown address, and offers a way home', async () => {
    await renderApp({ route: '/nowhere', seenWelcome: true });

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/home');
  });

  it('never mentions planning documents or phases in the interface', async () => {
    for (const route of ['/welcome', '/home', '/cart', '/account', '/sign-in']) {
      const { unmount } = await renderApp({ route, seenWelcome: true });
      expect(document.body.textContent).not.toMatch(/roadmap|phase|\bC[0-9]\b/i);
      unmount();
    }
  });
});

describe('accessibility basics', () => {
  it('starts with a skip link that targets the main landmark', async () => {
    await renderApp({ route: '/home', seenWelcome: true });

    const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(document.getElementById('main-content')).toBe(screen.getByRole('main'));
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });

  it('is the first thing a keyboard user reaches', async () => {
    const user = userEvent.setup();
    await renderApp({ route: '/home', seenWelcome: true });

    await user.tab();

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus();
  });

  it('also has a skip link and main landmark on the welcome screen', async () => {
    await renderApp({ route: '/welcome' });

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('keeps the browser title in step with the screen and the language', async () => {
    const user = userEvent.setup();
    await renderApp({ route: '/home', seenWelcome: true });
    expect(document.title).toBe('Home · ALL 5.75');

    await user.click(screen.getByRole('link', { name: 'Cart' }));
    expect(document.title).toBe('Cart · ALL 5.75');
  });

  it('titles screens in Arabic', async () => {
    await renderApp({ route: '/cart', seenWelcome: true, language: 'ar' });

    expect(document.title).toBe('السلة · الكل بـ 5.75');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(document.documentElement).toHaveAttribute('lang', 'ar');
  });
});
