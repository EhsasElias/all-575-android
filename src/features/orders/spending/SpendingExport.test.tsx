import { Capacitor } from '@capacitor/core';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CSV_PATH, freezeToday, openSpending } from './spendingTestSetup';

beforeEach(freezeToday);

afterEach(() => {
  vi.useRealTimers();
});

describe('Spending report: CSV download', () => {
  const createObjectURL = vi.fn<(blob: Blob) => string>();
  const revokeObjectURL = vi.fn<(url: string) => void>();
  const clicked: { href: string; download: string }[] = [];

  beforeEach(() => {
    createObjectURL.mockReset().mockReturnValue('blob:csv-1');
    revokeObjectURL.mockReset();
    clicked.length = 0;
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({ href: this.href, download: this.download });
    });
  });

  const csvReply = {
    text: '﻿Order,Status\r\nA575-IICOU1LN,cancelled\r\n',
    headers: {
      'Content-Type': 'text/csv; charset=UTF-8',
      'Content-Disposition': 'attachment; filename="all575-spending-2026-09-25-to-2026-10-24.csv"',
    },
  };

  it('downloads the exact bytes, keeping the byte-order mark, under the server file name', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const api = await openSpending({ [`GET ${CSV_PATH}`]: csvReply });

    await user.click(await screen.findByRole('button', { name: 'Download CSV' }));

    expect(
      await screen.findByText('Downloaded all575-spending-2026-09-25-to-2026-10-24.csv.'),
    ).toBeInTheDocument();
    const csvCall = api.calls().find((call) => call.path === CSV_PATH);
    expect(Object.fromEntries(csvCall?.query ?? [])).toEqual({
      from: '2026-09-25',
      to: '2026-10-24',
    });
    const blob = createObjectURL.mock.calls[0]?.[0];
    expect(blob?.size).toBe(new TextEncoder().encode(csvReply.text).length);
    const bytes = new Uint8Array((await blob?.arrayBuffer()) ?? new ArrayBuffer(0));
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes)).toBe(csvReply.text);
    expect(clicked).toEqual([
      { href: 'blob:csv-1', download: 'all575-spending-2026-09-25-to-2026-10-24.csv' },
    ]);
    expect(document.querySelector('a[download]')).toBeNull();
  });

  it('frees the temporary address after the download started', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await openSpending({ [`GET ${CSV_PATH}`]: csvReply });
    await user.click(await screen.findByRole('button', { name: 'Download CSV' }));
    await screen.findByText(/^Downloaded /);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv-1');
  });

  it('names the file from the period when the server sends no name', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await openSpending({
      [`GET ${CSV_PATH}`]: { text: 'Order\r\n', headers: { 'Content-Type': 'text/csv' } },
    });
    await user.click(await screen.findByRole('radio', { name: 'Last 7 days' }));
    await user.click(await screen.findByRole('button', { name: 'Download CSV' }));

    await screen.findByText(/^Downloaded /);
    expect(clicked[0]?.download).toBe('all575-spending-2026-10-18-to-2026-10-24.csv');
  });

  it('downloads the custom period that is on screen', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const api = await openSpending({ [`GET ${CSV_PATH}`]: csvReply });
    await user.click(await screen.findByRole('radio', { name: 'Custom range' }));
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-10-15' } });

    await user.click(screen.getByRole('button', { name: 'Download CSV' }));

    await screen.findByText(/^Downloaded /);
    const csvCall = api.calls().find((call) => call.path === CSV_PATH);
    expect(Object.fromEntries(csvCall?.query ?? [])).toEqual({
      from: '2026-10-01',
      to: '2026-10-15',
    });
  });

  it('says so when the download fails, and saves nothing', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await openSpending({ [`GET ${CSV_PATH}`]: { status: 500, body: { message: 'Boom' } } });

    await user.click(await screen.findByRole('button', { name: 'Download CSV' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('We could not prepare the file.');
    expect(screen.queryByText('Boom')).not.toBeInTheDocument();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(clicked).toEqual([]);
    expect(screen.getByRole('button', { name: 'Download CSV' })).toBeInTheDocument();
  });

  it('asks the customer to wait when downloads are rate limited', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await openSpending({
      [`GET ${CSV_PATH}`]: {
        status: 429,
        body: { message: 'Too Many Attempts.' },
        headers: { 'Retry-After': '30' },
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Download CSV' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Wait a minute and try again.');
  });

  it('is replaced by an honest note inside the Android app', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    await openSpending();

    expect(
      await screen.findByText('Exporting a CSV file is available on the web version for now.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download CSV' })).not.toBeInTheDocument();
  });
});
