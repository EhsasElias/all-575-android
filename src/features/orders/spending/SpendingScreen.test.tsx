import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { buildReport } from '../testReport';
import { holdRequests } from '../testHelpers';
import { REPORT_PATH, freezeToday, openSpending, reportCalls } from './spendingTestSetup';

beforeEach(freezeToday);

afterEach(() => {
  vi.useRealTimers();
});

describe('Spending report: the numbers', () => {
  it('shows the summary the API computed, with the period named', async () => {
    await openSpending();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'My spending' }),
    ).toBeInTheDocument();
    const summary = within(
      await screen.findByRole('region', { name: '25 Sept 2026 to 24 Oct 2026' }),
    );
    expect(summary.getByText('Net spent').nextElementSibling).toHaveTextContent(/^21\.50\s+SAR$/);
    expect(summary.getByText('Orders').nextElementSibling).toHaveTextContent('2');
    expect(summary.getByText('Paid').nextElementSibling).toHaveTextContent(/^43\.00\s+SAR$/);
    expect(summary.getByText('Refunded').nextElementSibling).toHaveTextContent(/^21\.50\s+SAR$/);
    expect(summary.getByText('VAT included').nextElementSibling).toHaveTextContent(/^5\.60\s+SAR$/);
    expect(summary.getByText('Savings from discounts').nextElementSibling).toHaveTextContent(
      /^2\.00\s+SAR$/,
    );
    expect(summary.getByText('Delivery fees').nextElementSibling).toHaveTextContent(
      /^20\.00\s+SAR$/,
    );
    expect(summary.getByText('Only refunds that were confirmed.')).toBeInTheDocument();
  });

  it('lists each order with its order, payment and refund dates kept apart', async () => {
    await openSpending();

    const rows = within(await screen.findByRole('region', { name: 'Orders in this period' }));
    const first = within(
      rows.getByRole('heading', { name: 'Order A575-IICOU1LN' }).closest('li') ?? document.body,
    );
    expect(first.getByText('Cancelled')).toBeInTheDocument();
    expect(first.getByText('Order date').nextElementSibling).toHaveTextContent(
      '24 Oct 2026, 8:18 pm',
    );
    expect(first.getByText('Payment date').nextElementSibling).toHaveTextContent(
      '24 Oct 2026, 8:20 pm',
    );
    expect(first.getByText('Refund date').nextElementSibling).toHaveTextContent(
      '26 Oct 2026, 12:00 pm',
    );
    const second = within(
      rows.getByRole('heading', { name: 'Order A575-ZZ99XY12' }).closest('li') ?? document.body,
    );
    expect(second.getByText('Refund date').nextElementSibling).toHaveTextContent('—');
  });

  it('shows a placeholder while loading', async () => {
    installFakeApi({
      'GET /me': { body: { data: testUser } },
      [`GET ${REPORT_PATH}`]: { body: { data: buildReport() } },
    });
    const gate = holdRequests(REPORT_PATH);
    await renderApp({ route: '/account/spending', signedIn: true, seenWelcome: true });

    expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument();
    gate.release();
    expect(
      await screen.findByRole('region', { name: 'Orders in this period' }),
    ).toBeInTheDocument();
  });

  it('invites the customer to shop when nothing was paid in the period', async () => {
    await openSpending({
      [`GET ${REPORT_PATH}`]: {
        body: {
          data: buildReport({
            rows: [],
            summary: {
              orders: 0,
              paid: 0,
              refunded: 0,
              net_spent: 0,
              savings: 0,
              vat_included: 0,
              delivery_fees: 0,
            },
          }),
        },
      },
    });

    expect(
      await screen.findByRole('heading', { name: 'No paid orders in this period' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start shopping' })).toHaveAttribute('href', '/home');
  });

  it('shows an error with a retry and recovers', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    let attempts = 0;
    await openSpending({
      [`GET ${REPORT_PATH}`]: () => {
        attempts += 1;
        return attempts === 1
          ? { status: 429, body: { message: 'Slow down' } }
          : { body: { data: buildReport() } };
      },
    });

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('We could not load your spending')).toBeInTheDocument();
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('region', { name: 'Orders in this period' }),
    ).toBeInTheDocument();
  });
});

describe('Spending report: the period', () => {
  it('starts with the last 30 days, in Saudi dates', async () => {
    const api = await openSpending();
    await screen.findByRole('region', { name: 'Orders in this period' });

    expect(reportCalls(api).map((call) => Object.fromEntries(call.query))).toEqual([
      { from: '2026-09-25', to: '2026-10-24' },
    ]);
    expect(screen.getByRole('radio', { name: 'Last 30 days' })).toBeChecked();
  });

  it('switches to the last 7 days', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const api = await openSpending();
    await user.click(await screen.findByRole('radio', { name: 'Last 7 days' }));

    await screen.findByRole('region', { name: 'Orders in this period' });
    const last = reportCalls(api).at(-1);
    expect(Object.fromEntries(last?.query ?? [])).toEqual({ from: '2026-10-18', to: '2026-10-24' });
  });

  it('asks for a custom range once both dates are valid', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const api = await openSpending();
    await user.click(await screen.findByRole('radio', { name: 'Custom range' }));

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-10-15' } });

    await screen.findByRole('region', { name: 'Orders in this period' });
    const last = reportCalls(api).at(-1);
    expect(Object.fromEntries(last?.query ?? [])).toEqual({ from: '2026-10-01', to: '2026-10-15' });
  });

  it('starts the custom range from the dates the customer was looking at', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await openSpending();
    await user.click(await screen.findByRole('radio', { name: 'Custom range' }));

    expect(screen.getByLabelText('From')).toHaveValue('2026-09-25');
    expect(screen.getByLabelText('To')).toHaveValue('2026-10-24');
  });

  it('does not ask the server when the end is before the start', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const api = await openSpending();
    await user.click(await screen.findByRole('radio', { name: 'Custom range' }));

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-10-20' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-10-10' } });

    expect(
      await screen.findByText('The end date must be on or after the start date.'),
    ).toBeInTheDocument();
    const asked = reportCalls(api).map(
      (call) => `${call.query.get('from')}..${call.query.get('to')}`,
    );
    expect(asked).not.toContain('2026-10-20..2026-10-10');
    expect(screen.getByRole('button', { name: 'Download CSV' })).toHaveAttribute('disabled');
  });

  it('waits for both dates when one is cleared', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await openSpending();
    await user.click(await screen.findByRole('radio', { name: 'Custom range' }));

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '' } });

    expect(
      await screen.findByText('Pick a start date and an end date to see your spending.'),
    ).toBeInTheDocument();
  });
});

describe('Spending report: languages', () => {
  it('reads right to left in Arabic with Latin digits and no English left over', async () => {
    await openSpending({}, 'ar');

    expect(await screen.findByRole('heading', { level: 1, name: 'مصروفاتي' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    const summary = within(
      await screen.findByRole('region', { name: 'من 25 سبتمبر 2026 إلى 24 أكتوبر 2026' }),
    );
    expect(summary.getByText('صافي المصروفات').nextElementSibling).toHaveTextContent(
      /21\.50\s+ر\.س/,
    );
    expect(screen.getByRole('radio', { name: 'آخر 30 يومًا' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'تنزيل ملف CSV' })).toBeInTheDocument();
    expect(screen.queryByText('Net spent')).not.toBeInTheDocument();
  });
});
