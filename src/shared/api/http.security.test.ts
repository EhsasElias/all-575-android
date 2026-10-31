/// <reference types="node" />
import { createServer } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { createHttpClient } from './http';
import { createMemoryTokenStore } from './token-store';

function setup(baseUrl = 'https://api.example.test/api/v1', fetchFn = vi.fn<typeof fetch>()) {
  const tokenStore = createMemoryTokenStore();
  void tokenStore.set('private-bearer');
  return {
    fetchFn,
    http: createHttpClient({ baseUrl, tokenStore, getLanguage: () => 'en', fetchFn }),
  };
}

describe('bearer request boundaries', () => {
  it.each([
    '/../outside',
    '/%2e%2e/outside',
    '//evil.test',
    'https://evil.test',
    '/products\\..\\outside',
    '/products?token=private',
    '/products#secret',
    '/bad\nheader',
  ])('refuses an unsafe path before sending any bearer: %s', async (path) => {
    const { http, fetchFn } = setup();
    await expect(http.get(path)).rejects.toMatchObject({ kind: 'unexpected' });
    await expect(http.download(path)).rejects.toMatchObject({ kind: 'unexpected' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it.each([
    'https://user:password@api.example.test/api',
    'https://api.example.test/api?secret=x',
    '//evil.test/api',
    'javascript:alert(1)',
    'api.example.test/api',
  ])('rejects unsafe configuration: %s', async (base) => {
    const { http, fetchFn } = setup(base);
    await expect(http.get('/me')).rejects.toMatchObject({ kind: 'unexpected' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('requires HTTPS in a customer release, while keeping explicit local/test builds usable', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_TEST_PANEL', 'false');
    try {
      const { http, fetchFn } = setup('http://api.example.test/api');
      await expect(http.get('/me')).rejects.toMatchObject({ kind: 'unexpected' });
      expect(fetchFn).not.toHaveBeenCalled();
      vi.stubEnv('VITE_TEST_PANEL', 'true');
      fetchFn.mockResolvedValue(new Response('{}'));
      await expect(http.get('/me')).resolves.toEqual({});
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it.each(['get', 'download'] as const)(
    'disables cookies, redirects, referrers and caching for %s',
    async (method) => {
      const { http, fetchFn } = setup();
      fetchFn.mockResolvedValue(new Response('{}'));
      await http[method]('/me');
      expect(fetchFn.mock.calls[0]?.[1]).toMatchObject({
        credentials: 'omit',
        redirect: 'error',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
      });
    },
  );

  it('does not follow a real redirect to another API path carrying the bearer', async () => {
    let outsideRequests = 0;
    const server = createServer((request, response) => {
      if (request.url === '/api/v1/me') {
        response.writeHead(302, { Location: '/outside' });
      } else {
        outsideRequests++;
        response.writeHead(200);
      }
      response.end('{}');
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    try {
      const address = server.address();
      if (address === null || typeof address === 'string') throw new Error('Missing test port');
      const tokenStore = createMemoryTokenStore();
      await tokenStore.set('private-bearer');
      const http = createHttpClient({
        baseUrl: `http://127.0.0.1:${address.port}/api/v1`,
        tokenStore,
        getLanguage: () => 'en',
      });
      await expect(http.get('/me')).rejects.toMatchObject({ kind: 'network' });
      expect(outsideRequests).toBe(0);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });
});
