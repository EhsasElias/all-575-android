import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { getPreference, loadPreferences } from '@/shared/storage';
import { createMemoryPreferences } from '@/test/memoryPreferences';
import { ThemePicker } from './ThemePicker';
import { ThemeSync } from './ThemeSync';
import { readTheme } from './useTheme';

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
});

describe('Appearance preference', () => {
  it('restores the saved theme before the first screen paints', async () => {
    await loadPreferences(createMemoryPreferences({ theme: 'dark' }));
    render(<ThemeSync />);
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('saves light mode and can return to the device setting', async () => {
    const user = userEvent.setup();
    const backend = createMemoryPreferences({ theme: 'dark' });
    await loadPreferences(backend);
    render(
      <>
        <ThemeSync />
        <ThemePicker />
      </>,
    );
    await user.click(screen.getByRole('radio', { name: 'Light' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    await expect(backend.get('theme')).resolves.toBe('light');
    await user.click(screen.getByRole('radio', { name: 'System' }));
    expect(document.documentElement).not.toHaveAttribute('data-theme');
    expect(getPreference('theme')).toBe('system');
    await loadPreferences(backend);
    expect(readTheme()).toBe('system');
  });

  it('falls back safely when the saved value is invalid', async () => {
    await loadPreferences(createMemoryPreferences({ theme: 'invalid' }));
    expect(readTheme()).toBe('system');
  });
});
