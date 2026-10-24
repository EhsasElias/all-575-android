import { getCurrentLanguage } from '@/shared/i18n';
import { env } from '@/shared/lib';
import { authEvents } from './auth-events';
import { createHttpClient } from './http';
import { createTokenStore } from './token-store';

export const tokenStore = createTokenStore();

export const http = createHttpClient({
  baseUrl: env.apiBaseUrl,
  tokenStore,
  getLanguage: getCurrentLanguage,
  onUnauthorized: () => {
    authEvents.emitUnauthorized();
  },
});
