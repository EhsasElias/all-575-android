import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportSuperAdminMetric } from './superAdminApi';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Exercise the real HTTP download client while intercepting its network boundary. */
function serveExport(bytes: Uint8Array, filename: string, contentType: string) {
  const fetchFn = vi.fn<typeof fetch>();
  fetchFn.mockResolvedValue(
    new Response(new Uint8Array(bytes).buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    }),
  );
  vi.stubGlobal('fetch', fetchFn);
  return fetchFn;
}

function recordedRequestUrl(fetchFn: ReturnType<typeof vi.fn<typeof fetch>>): URL {
  const input = fetchFn.mock.calls[0]?.[0];
  const value =
    typeof input === 'string' ? input : input instanceof URL ? input.href : (input?.url ?? '');
  return new URL(value, 'https://example.test');
}

describe('Super Admin statistics exports', () => {
  it('requests a valid XLSX export with the active report filters', async () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x01]);
    const fetchFn = serveExport(
      bytes,
      'all575-customers.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    const filters = { q: 'محمد', from: '2026-11-01', to: '2026-11-15' };
    const result = await exportSuperAdminMetric('customers', 'xlsx', filters);

    expect(fetchFn).toHaveBeenCalledOnce();
    const request = recordedRequestUrl(fetchFn);
    expect(request.pathname).toMatch(/\/platform\/super-admin\/metrics\/customers\/export\/xlsx$/);
    expect(Object.fromEntries(request.searchParams)).toEqual(filters);
    expect(result.filename).toBe('all575-customers.xlsx');
    expect(new Uint8Array(await result.blob.arrayBuffer())).toEqual(bytes);
  });

  it('keeps CSV as a separate correctly labelled export', async () => {
    const fetchFn = serveExport(
      new TextEncoder().encode('a,b'),
      'all575-customers.csv',
      'text/csv;charset=UTF-8',
    );

    const result = await exportSuperAdminMetric('customers', 'csv');

    expect(fetchFn).toHaveBeenCalledOnce();
    const request = recordedRequestUrl(fetchFn);
    expect(request.pathname).toMatch(/\/platform\/super-admin\/metrics\/customers\/export\/csv$/);
    expect(request.search).toBe('');
    expect(result.filename).toBe('all575-customers.csv');
    expect(await result.blob.text()).toBe('a,b');
  });
});
