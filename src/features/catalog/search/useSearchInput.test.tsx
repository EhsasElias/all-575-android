import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SEARCH_DEBOUNCE_MS, useSearchInput } from './useSearchInput';

function setUp(route = '/search') {
  return renderHook(() => ({ search: useSearchInput(), location: useLocation() }), {
    wrapper: ({ children }) => <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>,
  });
}

describe('useSearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces for exactly 300 ms', () => {
    const { result } = setUp();

    act(() => {
      result.current.search.change('milk');
    });
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    });
    expect(result.current.location.search).toBe('');
    expect(result.current.search.draft).toBe('milk');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.location.search).toBe('?q=milk');
    expect(result.current.search.query).toBe('milk');
    expect(SEARCH_DEBOUNCE_MS).toBe(300);
  });

  it('only keeps the last word typed within the wait', () => {
    const { result } = setUp();

    act(() => {
      result.current.search.change('mi');
    });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    act(() => {
      result.current.search.change('milk');
    });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current.location.search).toBe('');

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current.location.search).toBe('?q=milk');
  });

  it('trims the query it sends and drops it from the address when it is blank', () => {
    const { result } = setUp('/search?q=milk');

    act(() => {
      result.current.search.change('  ');
    });
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    expect(result.current.location.search).toBe('');
    expect(result.current.search.query).toBe('');
  });

  it('searches at once on submit and cancels the wait', () => {
    const { result } = setUp();

    act(() => {
      result.current.search.change('milk');
    });
    act(() => {
      result.current.search.submit();
    });

    expect(result.current.location.search).toBe('?q=milk');
  });

  it('forgets a pending search when the screen goes away', () => {
    const { result, unmount } = setUp();
    act(() => {
      result.current.search.change('milk');
    });

    unmount();

    expect(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });
});
