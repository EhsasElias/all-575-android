import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import { formatMoney } from '@/shared/i18n';
import { getPreference } from '@/shared/storage';
import { renderApp } from '@/test/render';
import { hasSeenWelcome } from './welcomeSeen';

const EN = {
  headline: 'Welcome, our partner in success',
  subline: 'Everything you need, in one place',
  cta: 'Tap the logo to shop now',
};

// The header sits inside <main>, so browsers do not expose it as a banner landmark.
function getHeader(): HTMLElement {
  const header = screen.getByRole('main').querySelector('header');
  if (!header) throw new Error('Header missing');
  return header;
}

const AR = {
  headline: 'نرحب بكم شريك النجاح',
  subline: 'كل ما تحتاجه، في مكان واحد',
  cta: 'اضغط على الشعار للتسوق الآن',
};

describe('Welcome copy: one language at a time', () => {
  it('shows only English when English is selected', async () => {
    await renderApp({ route: '/welcome', language: 'en' });

    expect(screen.getByRole('heading', { level: 1, name: EN.headline })).toBeInTheDocument();
    expect(screen.getByText(EN.subline)).toBeInTheDocument();
    expect(screen.queryByText(AR.subline)).not.toBeInTheDocument();
    expect(screen.queryByText('نرحب بكم')).not.toBeInTheDocument();
    expect(screen.queryByText(AR.cta)).not.toBeInTheDocument();
    expect(screen.queryByText('خضار وفواكه')).not.toBeInTheDocument();
    expect(screen.getByText('Skip')).toBeInTheDocument();
    expect(screen.getByText('Already a customer?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows only Arabic when Arabic is selected', async () => {
    await renderApp({ route: '/welcome', language: 'ar' });

    expect(screen.getByRole('heading', { level: 1, name: AR.headline })).toBeInTheDocument();
    expect(screen.getByText(AR.subline)).toBeInTheDocument();
    expect(screen.queryByText(EN.subline)).not.toBeInTheDocument();
    expect(screen.queryByText('Welcome,')).not.toBeInTheDocument();
    expect(screen.queryByText(EN.cta)).not.toBeInTheDocument();
    expect(screen.queryByText('Fruit & vegetables')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'تسجيل الدخول' })).toBeInTheDocument();
    expect(screen.getByText('لديك حساب؟')).toBeInTheDocument();
  });

  it('renders each message exactly once', async () => {
    await renderApp({ route: '/welcome', language: 'ar' });

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByText(AR.subline)).toHaveLength(1);
    // The call to action is both the visible button and the name of the logo button.
    expect(screen.getAllByRole('button', { name: AR.cta })).toHaveLength(2);
  });

  it('splits the headline into a dark line and a green line', async () => {
    await renderApp({ route: '/welcome', language: 'en' });

    expect(screen.getByText('Welcome,')).toBeInTheDocument();
    expect(screen.getByText('our partner in success')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toContainElement(
      screen.getByText('our partner in success'),
    );
  });

  it('does not flip language by itself', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderApp({ route: '/welcome', language: 'ar' });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(document.documentElement).toHaveAttribute('lang', 'ar');
    expect(screen.queryByText('Welcome,')).not.toBeInTheDocument();
  });
});

describe('Welcome price pill', () => {
  it.each([
    ['en', 'Everything · '],
    ['ar', 'كل شيء بـ '],
  ] as const)('builds the amount with formatMoney (%s)', async (language, prefix) => {
    await renderApp({ route: '/welcome', language });

    const expected = `${prefix}${formatMoney(575, language)}`.replace(/\s/g, ' ');
    expect(screen.getByText(prefix.trim(), { exact: false })).toHaveTextContent(expected);
  });

  it('reads 5.75 SAR in English and ر.س in Arabic', async () => {
    await renderApp({ route: '/welcome', language: 'en' });
    expect(screen.getByText(/Everything · 5\.75\s+SAR/)).toBeInTheDocument();

    await i18next.changeLanguage('ar');
    expect(await screen.findByText(/كل شيء بـ 5\.75\s+ر\.س/)).toBeInTheDocument();
  });
});

describe('Welcome header', () => {
  it.each(['en', 'fr', 'ar'] as const)(
    'puts Skip on the left, the language switch in the middle and the logo on the right (%s)',
    async (language) => {
      await renderApp({ route: '/welcome', language });
      const header = getHeader();

      expect(header).toHaveAttribute('dir', 'ltr');
      const [first, second, third] = [...header.children];
      expect(first).toHaveAttribute('href', '/welcome/logo');
      expect(second?.tagName).toBe('FIELDSET');
      expect(third?.tagName).toBe('BUTTON');
      expect(
        within(header)
          .getAllByRole('radio')
          .map((radio) => radio.getAttribute('value')),
      ).toEqual(['en', 'fr', 'ar']);
    },
  );

  it('makes the logo a button named by the call to action, with a decorative logo inside', async () => {
    await renderApp({ route: '/welcome', language: 'en' });
    const logoButton = within(getHeader()).getByRole('button', { name: EN.cta });

    expect(within(logoButton).queryByRole('img')).not.toBeInTheDocument();
    expect(logoButton.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no second logo above the call to action', async () => {
    await renderApp({ route: '/welcome', language: 'en' });

    expect(document.querySelectorAll('main svg[viewBox="0 0 239 213"]')).toHaveLength(1);
  });
});

describe('Welcome language choice', () => {
  it('switches the whole screen, the document direction, and remembers the choice', async () => {
    const user = userEvent.setup();
    await renderApp({ route: '/welcome', language: 'ar' });
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');

    await user.click(screen.getByRole('radio', { name: /EN/ }));

    expect(screen.getByRole('heading', { level: 1, name: EN.headline })).toBeInTheDocument();
    expect(screen.queryByText(AR.subline)).not.toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
    expect(getPreference('language')).toBe('en');
  });

  it('reflects the selected language in the switch', async () => {
    await renderApp({ route: '/welcome', language: 'ar' });

    expect(screen.getByRole('radio', { name: /AR/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /EN/ })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: /FR/ })).not.toBeChecked();
  });
});

describe('Welcome navigation', () => {
  it('has no tab bar', async () => {
    await renderApp({ route: '/welcome' });

    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
  });

  it('opens the shopping home from the logo, and remembers the welcome was seen', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp({ route: '/welcome' });
    expect(hasSeenWelcome()).toBe(false);

    await user.click(within(getHeader()).getByRole('button', { name: EN.cta }));

    expect(router.state.location.pathname).toBe('/welcome/logo');
    await waitFor(
      () => {
        expect(router.state.location.pathname).toBe('/home');
      },
      { timeout: 3000 },
    );
    expect(hasSeenWelcome()).toBe(true);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('opens the shopping home from the call to action button', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp({ route: '/welcome' });

    await user.click(
      within(screen.getByRole('main')).getAllByRole('button', { name: EN.cta })[1] ?? document.body,
    );

    expect(router.state.location.pathname).toBe('/welcome/logo');
    await waitFor(
      () => {
        expect(router.state.location.pathname).toBe('/home');
      },
      { timeout: 3000 },
    );
    expect(hasSeenWelcome()).toBe(true);
  });

  it('skips to the shopping home', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp({ route: '/welcome' });

    await user.click(screen.getByRole('link', { name: 'Skip' }));

    expect(router.state.location.pathname).toBe('/welcome/logo');
    await waitFor(
      () => {
        expect(router.state.location.pathname).toBe('/home');
      },
      { timeout: 3000 },
    );
    expect(hasSeenWelcome()).toBe(true);
  });

  it('goes to sign in from the small link', async () => {
    const user = userEvent.setup();
    const { router } = await renderApp({ route: '/welcome' });

    await user.click(screen.getByRole('link', { name: 'Sign in' }));

    expect(router.state.location.pathname).toBe('/sign-in');
    expect(hasSeenWelcome()).toBe(true);
  });
});
