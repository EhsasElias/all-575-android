import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { secondsUntil, useResendCountdown } from './useResendCountdown';

describe('secondsUntil', () => {
  it('rounds up so the display never shows 0 while there is still time', () => {
    expect(secondsUntil(10_000, 0)).toBe(10);
    expect(secondsUntil(10_000, 9_001)).toBe(1);
    expect(secondsUntil(10_000, 10_000)).toBe(0);
    expect(secondsUntil(10_000, 20_000)).toBe(0);
  });
});

describe('useResendCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: 1_000_000 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down once a second and stops at zero', () => {
    const resendAt = Date.now() + 3_000;
    const { result } = renderHook(() => useResendCountdown(resendAt));
    expect(result.current).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current).toBe(2);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current).toBe(0);
  });

  it('shows the right number straight away when a new time arrives', () => {
    const { result, rerender } = renderHook(({ at }) => useResendCountdown(at), {
      initialProps: { at: 1_000_000 + 1_000 },
    });
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current).toBe(0);

    rerender({ at: Date.now() + 60_000 });

    expect(result.current).toBe(60);
  });

  it('is already zero for a time in the past', () => {
    const resendAt = Date.now() - 1;
    const { result } = renderHook(() => useResendCountdown(resendAt));

    expect(result.current).toBe(0);
  });
});
