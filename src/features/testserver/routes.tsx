import type { RouteObject } from 'react-router';
import { isTestServerEnabled, routePaths, titled } from '@/shared/lib';

/** Only a test build has this screen; in any other build the address is simply not found. */
export const testServerRoutes: RouteObject[] = isTestServerEnabled()
  ? [
      {
        path: routePaths.testServer,
        lazy: async () => ({
          Component: (await import('./TestServerScreen')).TestServerScreen,
        }),
        handle: titled((t) => t('title', { ns: 'testserver' })),
      },
    ]
  : [];
