import { getCurrentLanguage } from '@/shared/i18n';
import { env, isTestServerEnabled } from '@/shared/lib';
import { authEvents } from './auth-events';
import { createHttpClient } from './http';
import { requestTracer } from './requestTrace';
import { createTokenStore } from './token-store';

export const tokenStore = createTokenStore();

export const http = createHttpClient({
  baseUrl: env.apiBaseUrl,
  tokenStore,
  getLanguage: getCurrentLanguage,
  onUnauthorized: () => {
    authEvents.emitUnauthorized();
  },
  ...(isTestServerEnabled() ? { trace: requestTracer } : {}),
});
