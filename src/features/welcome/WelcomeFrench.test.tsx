import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getPreference } from '@/shared/storage';
import { renderApp } from '@/test/render';

describe('Welcome in French', () => {
  it('shows only French, left to right', async () => {
    await renderApp({ route: '/welcome', language: 'fr' });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Bienvenue, partenaire de réussite' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Tout ce dont vous avez besoin, au même endroit')).toBeInTheDocument();
    expect(screen.getByText('Passer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Se connecter' })).toBeInTheDocument();
    expect(screen.queryByText('Skip')).not.toBeInTheDocument();
    expect(screen.queryByText('تخطي')).not.toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'fr');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
  });

  it('writes the one price with a comma and SAR', async () => {
    await renderApp({ route: '/welcome', language: 'fr' });

    expect(screen.getByText(/Tout à 5,75\s+SAR/)).toBeInTheDocument();
  });

  it('switches to French from the language choice and remembers it', async () => {
    const user = userEvent.setup();
    await renderApp({ route: '/welcome', language: 'ar' });
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');

    await user.click(screen.getByRole('radio', { name: /FR/ }));

    expect(screen.getByText('Passer')).toBeInTheDocument();
    expect(screen.queryByText('تخطي')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /FR/ })).toBeChecked();
    expect(document.documentElement).toHaveAttribute('lang', 'fr');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
    expect(getPreference('language')).toBe('fr');
  });
});
