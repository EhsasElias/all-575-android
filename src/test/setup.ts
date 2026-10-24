import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { appResources } from '@/app/i18n-resources';
import { initI18n } from '@/shared/i18n';
import { loadPreferences } from '@/shared/storage';
import { installBrowserStubs, resetBrowserStubs } from './browserStubs';
import { createMemoryPreferences } from './memoryPreferences';

beforeAll(async () => {
  installBrowserStubs();
  await initI18n({ resources: appResources, language: 'en' });
});

beforeEach(async () => {
  await loadPreferences(createMemoryPreferences());
});

afterEach(async () => {
  cleanup();
  vi.useRealTimers();
  resetBrowserStubs();
  await i18next.changeLanguage('en');
});
