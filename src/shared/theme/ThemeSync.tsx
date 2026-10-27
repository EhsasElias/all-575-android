import { useLayoutEffect } from 'react';
import { applyTheme, useTheme } from './useTheme';

export function ThemeSync() {
  const { choice } = useTheme();

  useLayoutEffect(() => {
    applyTheme(choice);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const updateChrome = () => {
      const dark = choice === 'dark' || (choice === 'system' && media.matches);
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? '#0e1612' : '#fbfcfa');
    };
    updateChrome();
    media.addEventListener('change', updateChrome);
    return () => {
      media.removeEventListener('change', updateChrome);
    };
  }, [choice]);

  return null;
}
