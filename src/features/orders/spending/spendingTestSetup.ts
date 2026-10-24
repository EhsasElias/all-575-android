import { vi } from 'vitest';
import { installFakeApi, type FakeRoutes } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { buildReport } from '../testReport';

export const REPORT_PATH = '/me/reports/spending';
export const CSV_PATH = '/me/reports/spending.csv';
// Saturday 24 Oct 2026, 15:00 in Riyadh.
export const NOW = new Date('2026-10-24T12:00:00Z');

/** Freezes "today" so the preset periods have known dates. Call it from `beforeEach`. */
export function freezeToday(): void {
  vi.useFakeTimers({ shouldAdvanceTime: true, now: NOW });
}

export function openSpending(routes: FakeRoutes = {}, language: 'en' | 'ar' = 'en') {
  const api = installFakeApi({
    'GET /me': { body: { data: testUser } },
    [`GET ${REPORT_PATH}`]: { body: { data: buildReport() } },
    ...routes,
  });
  return renderApp({
    route: '/account/spending',
    signedIn: true,
    seenWelcome: true,
    language,
  }).then(() => api);
}

export const reportCalls = (api: Awaited<ReturnType<typeof openSpending>>) =>
  api.calls().filter((call) => call.path === REPORT_PATH);
