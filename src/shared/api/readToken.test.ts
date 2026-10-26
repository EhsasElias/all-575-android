import { afterEach, describe, expect, it, vi } from 'vitest';
import { readToken, type TokenStore } from './token-store';

const storeWith = (get: TokenStore['get']): TokenStore => ({
  get,
  set: () => Promise.resolve(),
  clear: () => Promise.resolve(),
});

afterEach(() => {
  vi.useRealTimers();
});

describe('readToken', () => {
  it('returns the stored token', async () => {
    const onProblem = vi.fn();

    expect(
      await readToken(
        storeWith(() => Promise.resolve('a575_x')),
        onProblem,
      ),
    ).toBe('a575_x');
    expect(onProblem).not.toHaveBeenCalled();
  });

  it('returns null when there is no token', async () => {
    expect(await readToken(storeWith(() => Promise.resolve(null)))).toBeNull();
  });

  it('treats storage that fails as no token, and says so', async () => {
    const onProblem = vi.fn();

    const token = await readToken(
      storeWith(() => Promise.reject(new Error('locked'))),
      onProblem,
    );

    expect(token).toBeNull();
    expect(onProblem).toHaveBeenCalledWith('unreadable');
  });

  it('gives up on storage that never answers, instead of waiting for ever', async () => {
    vi.useFakeTimers();
    const onProblem = vi.fn();
    const answer = readToken(
      storeWith(() => new Promise<never>(() => undefined)),
      onProblem,
    );

    await vi.advanceTimersByTimeAsync(4_999);
    expect(onProblem).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(await answer).toBeNull();
    expect(onProblem).toHaveBeenCalledWith('timeout');
  });

  it('is not fooled by a token that happens to be the word "timeout"', async () => {
    expect(await readToken(storeWith(() => Promise.resolve('timeout')))).toBe('timeout');
  });
});
