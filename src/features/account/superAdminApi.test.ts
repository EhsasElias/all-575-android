import { describe, expect, it, vi } from 'vitest';
import { http } from '@/shared/api';
import { exportSuperAdminMetric } from './superAdminApi';

vi.mock('@/shared/api', () => ({
  http: { download: vi.fn() },
}));

describe('Super Admin statistics exports', () => {
  it('requests a real XLSX export with the active report filters', async () => {
    vi.mocked(http.download).mockResolvedValue({
      blob: new Blob(['PK'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      filename: 'all575-customers.xlsx',
    });

    const filters = { q: 'محمد', from: '2026-11-01', to: '2026-11-15' };
    const result = await exportSuperAdminMetric('customers', 'xlsx', filters);

    expect(http.download).toHaveBeenCalledWith(
      '/platform/super-admin/metrics/customers/export/xlsx',
      { query: filters },
    );
    expect(result.filename).toBe('all575-customers.xlsx');
  });

  it('keeps CSV as a separate correctly labelled export', async () => {
    vi.mocked(http.download).mockResolvedValue({
      blob: new Blob(['a,b'], { type: 'text/csv;charset=UTF-8' }),
      filename: 'all575-customers.csv',
    });

    await exportSuperAdminMetric('customers', 'csv');

    expect(http.download).toHaveBeenCalledWith(
      '/platform/super-admin/metrics/customers/export/csv',
      { query: {} },
    );
  });
});
