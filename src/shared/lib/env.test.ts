import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadEnv() {
  vi.resetModules();
  return (await import('./env')).env;
}

afterEach(() => {
  delete window.ALL575_CONFIG;
  vi.unstubAllEnvs();
});

describe('env.apiBaseUrl', () => {
  it('uses the address from config.js when it is set, so a build can be pointed elsewhere without rebuilding', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://built-in.example/api/v1');
    window.ALL575_CONFIG = { apiBaseUrl: ' https://api.example/api/v1 ' };

    expect((await loadEnv()).apiBaseUrl).toBe('https://api.example/api/v1');
  });

  it.each([undefined, '', '   '])(
    'falls back to the built-in address when config.js says %j',
    async (value) => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://built-in.example/api/v1');
      window.ALL575_CONFIG = value === undefined ? {} : { apiBaseUrl: value };

      expect((await loadEnv()).apiBaseUrl).toBe('https://built-in.example/api/v1');
    },
  );

  it('is empty when nothing is configured', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');

    expect((await loadEnv()).apiBaseUrl).toBe('');
  });
});
