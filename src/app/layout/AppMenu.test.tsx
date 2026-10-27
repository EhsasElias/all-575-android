import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getPreference } from '@/shared/storage';
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';

const categories = {
  data: [
    {
      id: 1,
      slug: 'clothing',
      name: { ar: 'ملابس', en: 'Clothing' },
      image_url: null,
      children: [],
    },
  ],
};

describe('Side menu', () => {
  it.each([
    { language: 'en', open: 'Open menu', title: 'Menu', categories: 'Categories' },
    { language: 'ar', open: 'فتح القائمة', title: 'القائمة', categories: 'الفئات' },
    { language: 'fr', open: 'Ouvrir le menu', title: 'Menu', categories: 'Catégories' },
  ] as const)('opens and navigates in $language', async (copy) => {
    const user = userEvent.setup();
    installFakeApi({ 'GET /categories': { body: categories } });
    const { router } = await renderApp({
      route: '/account',
      seenWelcome: true,
      language: copy.language,
    });

    await user.click(screen.getByRole('button', { name: copy.open }));
    const dialog = screen.getByRole('dialog', { name: copy.title });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.body.style.overflow).toBe('hidden');
    await user.click(within(dialog).getByText(copy.categories, { exact: true }));
    const categoryName = copy.language === 'ar' ? 'ملابس' : 'Clothing';
    await user.click(await within(dialog).findByRole('link', { name: categoryName }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/categories/clothing');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes on Escape and restores focus to its opener', async () => {
    const user = userEvent.setup();
    installFakeApi({ 'GET /categories': { body: categories } });
    await renderApp({ route: '/account', seenWelcome: true });
    const opener = screen.getByRole('button', { name: 'Open menu' });
    await user.click(opener);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('changes language and saves a manual dark or light choice', async () => {
    const user = userEvent.setup();
    installFakeApi({ 'GET /categories': { body: categories } });
    await renderApp({ route: '/account', seenWelcome: true });
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Menu' });
    await user.click(within(dialog).getByRole('radio', { name: 'Dark', exact: true }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(getPreference('theme')).toBe('dark');
    await user.click(within(dialog).getByRole('radio', { name: /FR/ }));
    expect(document.documentElement).toHaveAttribute('lang', 'fr');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
    await user.click(within(dialog).getByRole('radio', { name: 'Clair', exact: true }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(getPreference('theme')).toBe('light');
  });
});
