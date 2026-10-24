import { describe, expect, it, vi } from 'vitest';
import { createHttpClient } from './http';
import { createMemoryTokenStore } from './token-store';

function setup(token?: string) {
  const fetchFn = vi.fn<typeof fetch>();
  const tokenStore = createMemoryTokenStore();
  if (token) void tokenStore.set(token);
  const onUnauthorized = vi.fn();
  const http = createHttpClient({
    baseUrl: 'https://api.example.test/api',
    tokenStore,
    getLanguage: () => 'ar',
    fetchFn,
    onUnauthorized,
  });
  return { http, fetchFn, tokenStore, onUnauthorized };
}

function sentHeaders(fetchFn: ReturnType<typeof setup>['fetchFn']): Headers {
  return new Headers(fetchFn.mock.calls.at(-1)?.[1]?.headers);
}

describe('extra request headers', () => {
  it('sends them, for example an idempotency key', async () => {
    const { http, fetchFn } = setup();
    fetchFn.mockResolvedValue(new Response('{}'));

    await http.post('/checkout', { quote_id: 'q1' }, { headers: { 'Idempotency-Key': 'k-1' } });

    expect(sentHeaders(fetchFn).get('Idempotency-Key')).toBe('k-1');
  });

  it('never lets a caller replace the bearer token or the language', async () => {
    const { http, fetchFn } = setup('real-token');
    fetchFn.mockResolvedValue(new Response('{}'));

    await http.get('/me', { headers: { Authorization: 'Bearer forged', 'Accept-Language': 'en' } });

    expect(sentHeaders(fetchFn).get('Authorization')).toBe('Bearer real-token');
    expect(sentHeaders(fetchFn).get('Accept-Language')).toBe('ar');
  });
});

describe('download', () => {
  it('returns the exact bytes, keeping a UTF-8 byte-order mark, and the file name', async () => {
    const { http, fetchFn } = setup('t');
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x61, 0x2c, 0x62]);
    fetchFn.mockResolvedValue(
      new Response(bytes, {
        headers: {
          'Content-Type': 'text/csv; charset=UTF-8',
          'Content-Disposition': 'attachment; filename="spending-2026-10.csv"',
        },
      }),
    );

    const file = await http.download('/me/reports/spending.csv', { query: { from: '2026-10-01' } });

    expect(new Uint8Array(await file.blob.arrayBuffer())).toEqual(bytes);
    expect(file.filename).toBe('spending-2026-10.csv');
    expect(sentHeaders(fetchFn).get('Authorization')).toBe('Bearer t');
    expect(fetchFn.mock.calls.at(-1)?.[0]).toBe(
      'https://api.example.test/api/me/reports/spending.csv?from=2026-10-01',
    );
  });

  it('has no file name when the server sends none', async () => {
    const { http, fetchFn } = setup();
    fetchFn.mockResolvedValue(new Response('x'));

    await expect(http.download('/file')).resolves.toMatchObject({ filename: null });
  });

  it('fails like any other request, with the business code, and signs out on 401', async () => {
    const { http, fetchFn, tokenStore, onUnauthorized } = setup('t');
    fetchFn.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Nope', code: 'export_failed' }), { status: 422 }),
    );
    await expect(http.download('/file')).rejects.toMatchObject({
      kind: 'validation',
      code: 'export_failed',
    });

    fetchFn.mockResolvedValueOnce(new Response('{}', { status: 401 }));
    await expect(http.download('/file')).rejects.toMatchObject({ kind: 'unauthenticated' });
    expect(await tokenStore.get()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
