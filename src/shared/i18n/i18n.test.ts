import i18next from 'i18next';
import { describe, expect, it } from 'vitest';
import { loadPreferences } from '@/shared/storage';
import { createMemoryPreferences } from '@/test/memoryPreferences';
import { changeLanguage, getCurrentLanguage } from './i18n';

describe('language switching', () => {
  it('sets lang and dir on <html> when the language changes', async () => {
    await changeLanguage('ar');
    expect(document.documentElement).toHaveAttribute('lang', 'ar');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');

    await changeLanguage('en');
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');

    await changeLanguage('fr');
    expect(document.documentElement).toHaveAttribute('lang', 'fr');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
  });

  it('translates into the chosen language and reports it', async () => {
    await changeLanguage('ar');
    expect(i18next.t('nav.cart')).toBe('السلة');
    expect(getCurrentLanguage()).toBe('ar');

    await changeLanguage('en');
    expect(i18next.t('nav.cart')).toBe('Cart');
    expect(getCurrentLanguage()).toBe('en');

    await changeLanguage('fr');
    expect(i18next.t('nav.cart')).toBe('Panier');
    expect(getCurrentLanguage()).toBe('fr');
  });

  it('remembers the choice for the next launch', async () => {
    const preferences = createMemoryPreferences();
    await loadPreferences(preferences);

    await changeLanguage('ar');

    await expect(preferences.get('language')).resolves.toBe('ar');

    await changeLanguage('fr');

    await expect(preferences.get('language')).resolves.toBe('fr');
  });
});
