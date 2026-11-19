import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRequestUrl } from './requestUrl';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('API request origins in preview and production', () => {
  it('allows a same-origin, relative API prefix for local browser previews', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_TEST_PANEL', 'false');
    expect(window.location.hostname).toBe('localhost');
    expect(buildRequestUrl('/api/v1', '/categories', undefined)).toBe('/api/v1/categories');
  });

  it('does not allow insecure external API hosts in a production build', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_TEST_PANEL', 'false');
    expect(() =>
      buildRequestUrl('http://external.example/api/v1', '/categories', undefined),
    ).toThrow('The API address is not safe to use');
  });

  it('never lets an API route escape its configured prefix', () => {
    expect(() => buildRequestUrl('/api/v1', '/../accounts', undefined)).toThrow(
      'The API address is not safe to use',
    );
  });
});
