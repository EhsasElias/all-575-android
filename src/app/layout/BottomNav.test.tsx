import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { BottomNav } from './BottomNav';

function renderNav(props: Parameters<typeof BottomNav>[0] = {}, route = '/home') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <BottomNav {...props} />
    </MemoryRouter>,
  );
}

describe('BottomNav', () => {
  it('has the five tabs, in order, as links', () => {
    renderNav();

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Home',
      'Categories',
      'Cart',
      'Orders',
      'Account',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/home',
      '/categories',
      '/cart',
      '/orders',
      '/account',
    ]);
  });

  it('sends guests who tap Account to the logo transition before sign-in', () => {
    renderNav({ guest: true });

    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute(
      'href',
      '/welcome/logo?mode=account',
    );
    expect(screen.getByRole('link', { name: 'Cart' })).toHaveAttribute('href', '/cart');
  });

  it('marks the current tab with aria-current, not only with color', () => {
    renderNav({}, '/orders');

    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('shows no badge by default', () => {
    renderNav();

    expect(screen.queryByText(/Items in cart/)).not.toBeInTheDocument();
  });

  it('shows a count on the cart tab and names it for screen readers', () => {
    renderNav({ badges: { cart: 3 } });

    const cart = screen.getByRole('link', { name: /Cart/ });
    expect(cart).toHaveAccessibleName('Cart, Items in cart: 3');
    expect(within(cart).getByText('3')).toBeInTheDocument();
  });

  it('caps large counts', () => {
    renderNav({ badges: { cart: 250 } });

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('labels the tabs in Arabic when the language is Arabic', async () => {
    const { default: i18next } = await import('i18next');
    await i18next.changeLanguage('ar');
    renderNav({ badges: { cart: 3 } });

    expect(screen.getByRole('navigation', { name: 'التنقل الرئيسي' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /الرئيسية/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /السلة/ })).toHaveAccessibleName(
      'السلة، عدد المنتجات في السلة: 3',
    );
  });
});
