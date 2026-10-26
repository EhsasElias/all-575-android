import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tokenStore } from '@/shared/api';
import { StorageCheck } from './StorageCheck';
import { STORAGE_CHECK_GIVE_UP_MS } from './useStorageCheck';

afterEach(() => {
  vi.useRealTimers();
});

async function press() {
  const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
  await user.click(screen.getByRole('button', { name: 'Check secure storage' }));
}

describe('Test build: the secure storage check', () => {
  it('says that storage answered, and whether a sign-in is saved', async () => {
    vi.spyOn(tokenStore, 'get').mockResolvedValue(null);
    render(<StorageCheck />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Check secure storage' }));

    expect(await screen.findByText(/Answered in \d+ ms: no sign-in saved\./)).toBeVisible();
  });

  it('says so when a sign-in is saved', async () => {
    vi.spyOn(tokenStore, 'get').mockResolvedValue('a575_x');
    render(<StorageCheck />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Check secure storage' }));

    expect(await screen.findByText(/a sign-in is saved\./)).toBeVisible();
  });

  it('shows the error when storage fails', async () => {
    vi.spyOn(tokenStore, 'get').mockRejectedValue(new Error('Keystore locked'));
    render(<StorageCheck />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Check secure storage' }));

    expect(await screen.findByText(/Failed in \d+ ms: Error: Keystore locked/)).toBeVisible();
  });

  it('says so when storage never answers', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(tokenStore, 'get').mockImplementation(() => new Promise<never>(() => undefined));
    render(<StorageCheck />);

    await press();
    expect(screen.getByRole('button', { name: 'Checking…' })).toBeVisible();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(STORAGE_CHECK_GIVE_UP_MS);
    });

    expect(screen.getByText('No answer after 8 s.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Check secure storage' })).toBeVisible();
  });
});
