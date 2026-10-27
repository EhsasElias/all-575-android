import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import '@/shared/design/tokens.css';
import '@/shared/design/base.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initI18n, resolveInitialLanguage } from '@/shared/i18n';
import { getPreference, loadPreferences } from '@/shared/storage';
import { applyTheme, readTheme } from '@/shared/theme';
import { App } from './App';
import { appResources } from './i18n-resources';
import { createAppRouter } from './router';

/** Everything the first render reads synchronously is loaded here, before React starts. */
export async function bootstrap(): Promise<void> {
  await loadPreferences();
  applyTheme(readTheme());
  await initI18n({
    resources: appResources,
    language: resolveInitialLanguage({
      stored: getPreference('language'),
      deviceLanguage: navigator.languages[0] ?? navigator.language,
    }),
  });

  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('The #root element is missing from index.html');

  createRoot(rootElement).render(
    <StrictMode>
      <App router={createAppRouter()} />
    </StrictMode>,
  );
}
