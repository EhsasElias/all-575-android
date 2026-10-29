import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { buildReport } from '../testReport';

describe('Spending filters and matching CSV', () => {
  it('uses the same category, seller and status for the report and download', async () => {
    const api = installFakeApi({
      'GET /me': { body: { data: testUser } },
      'GET /me/reports/spending': { body: { data: buildReport() } },
      'GET /me/reports/spending.csv': {
        text: 'Order\r\nA575-TEST',
        headers: { 'Content-Type': 'text/csv' },
      },
      'GET /categories': {
        body: {
          data: [
            {
              id: 1,
              slug: 'food',
              name: { en: 'Food', ar: 'أطعمة' },
              image_url: null,
              children: [],
            },
          ],
        },
      },
      'GET /sellers': {
        body: {
          data: [
            { slug: 'home-store', name: { en: 'Home Store', ar: 'متجر البيت' }, logo_url: null },
          ],
        },
      },
    });
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL: () => 'blob:test', revokeObjectURL: () => undefined }),
    );
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const user = userEvent.setup();
    await renderApp({ route: '/account/spending', signedIn: true, seenWelcome: true });
    await user.click(screen.getByText('Filter spending orders'));
    await screen.findByRole('option', { name: 'Food' });
    await user.selectOptions(screen.getByLabelText('Orders containing category'), 'food');
    await user.selectOptions(screen.getByLabelText('Orders containing seller'), 'home-store');
    await user.selectOptions(screen.getByLabelText('Order status'), 'completed');
    await waitFor(() => {
      const query = api
        .calls()
        .filter((call) => call.path === '/me/reports/spending')
        .at(-1)?.query;
      expect(query?.get('category')).toBe('food');
      expect(query?.get('seller')).toBe('home-store');
      expect(query?.get('status')).toBe('completed');
    });
    await user.click(screen.getByRole('button', { name: 'Download CSV' }));
    await waitFor(() => {
      const query = api.calls().find((call) => call.path.endsWith('spending.csv'))?.query;
      expect(query?.get('category')).toBe('food');
      expect(query?.get('seller')).toBe('home-store');
      expect(query?.get('status')).toBe('completed');
    });
  });
});
