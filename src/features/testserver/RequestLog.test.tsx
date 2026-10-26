import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, within } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearTrace, requestTracer } from '@/shared/api/requestTrace';
import { SessionProvider } from '@/shared/session';
import { fakeApi } from '@/test/fakeApi';
import { RequestLog } from './RequestLog';

function mount() {
  const session = fakeApi();
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <SessionProvider client={session.client} store={session.store}>
        <RequestLog />
      </SessionProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  clearTrace();
  vi.useRealTimers();
});

describe('Test build: the recent requests', () => {
  it('says so when nothing has been asked yet', async () => {
    mount();

    expect(await screen.findByText('No requests yet.')).toBeVisible();
    expect(
      screen.getByText(/Network: online, query manager: online, session: guest/),
    ).toBeVisible();
  });

  it('shows where each request stands, newest first', async () => {
    mount();
    await screen.findByText(/session: guest/);

    act(() => {
      requestTracer.begin('GET', '/store').done(200);
      requestTracer.begin('GET', '/products').failed('network');
      requestTracer.begin('GET', '/categories');
    });

    const rows = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      'GET /categorieswaiting for secure storage, 0 s',
      expect.stringMatching(/^GET \/productsfailed: network, \d+ ms$/),
      expect.stringMatching(/^GET \/store200, \d+ ms$/),
    ]);
  });

  it('counts the seconds a request has been waiting for the server', async () => {
    vi.useFakeTimers();
    mount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => {
      requestTracer.begin('GET', '/categories').sending('secure storage timeout');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(7_000);
    });

    expect(screen.getByText('waiting for the server, 7 s (secure storage timeout)')).toBeVisible();
  });

  it('is available in Arabic', async () => {
    await i18next.changeLanguage('ar');
    mount();

    expect(await screen.findByRole('heading', { name: 'آخر الطلبات' })).toBeVisible();
    expect(screen.getByText('لا توجد طلبات بعد.')).toBeVisible();
  });
});
