import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeServerAddress } from './testServer';

describe('normalizeServerAddress', () => {
  it.each([
    ['192.168.1.23:8000', 'http://192.168.1.23:8000/api/v1'],
    ['  192.168.1.23:8000/  ', 'http://192.168.1.23:8000/api/v1'],
    ['http://192.168.1.23:8000', 'http://192.168.1.23:8000/api/v1'],
    ['localhost:8000', 'http://localhost:8000/api/v1'],
    ['https://abc-def.trycloudflare.com', 'https://abc-def.trycloudflare.com/api/v1'],
    ['https://abc-def.trycloudflare.com/api/v1/', 'https://abc-def.trycloudflare.com/api/v1'],
    ['https://example.com/custom/base', 'https://example.com/custom/base'],
  ])('turns %j into %j', (typed, expected) => {
    expect(normalizeServerAddress(typed)).toBe(expected);
  });

  it.each([
    '',
    '   ',
    'not a url',
    'http://',
    'ftp://192.168.1.23',
    'javascript:alert(1)',
    'https://user:secret@example.com',
    'https://example.com/api/v1?token=abc',
    'https://example.com/#fragment',
  ])('refuses %j', (typed) => {
    expect(normalizeServerAddress(typed)).toBeNull();
  });
});

async function loadEnv() {
  vi.resetModules();
  return (await import('./env')).env;
}

describe('a saved server address', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://built-in.example/api/v1');
  });

  afterEach(() => {
    window.localStorage.clear();
    delete window.ALL575_CONFIG;
    vi.unstubAllEnvs();
  });

  it('wins over config.js and the built-in address in a test build', async () => {
    vi.stubEnv('VITE_TEST_PANEL', 'true');
    window.ALL575_CONFIG = { apiBaseUrl: 'https://config.example/api/v1' };
    window.localStorage.setItem('all575.testServer', 'http://192.168.1.23:8000/api/v1');

    expect((await loadEnv()).apiBaseUrl).toBe('http://192.168.1.23:8000/api/v1');
  });

  it('is ignored by a build that is not a test build, so no stored value can redirect the app', async () => {
    vi.stubEnv('VITE_TEST_PANEL', '');
    window.localStorage.setItem('all575.testServer', 'http://evil.example/api/v1');

    expect((await loadEnv()).apiBaseUrl).toBe('https://built-in.example/api/v1');
  });

  it('is ignored when what was stored is not a web address', async () => {
    vi.stubEnv('VITE_TEST_PANEL', 'true');
    window.localStorage.setItem('all575.testServer', 'javascript:alert(1)');

    expect((await loadEnv()).apiBaseUrl).toBe('https://built-in.example/api/v1');
  });

  it('is ignored when the browser will not let the app read its storage', async () => {
    vi.stubEnv('VITE_TEST_PANEL', 'true');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect((await loadEnv()).apiBaseUrl).toBe('https://built-in.example/api/v1');
  });
});
