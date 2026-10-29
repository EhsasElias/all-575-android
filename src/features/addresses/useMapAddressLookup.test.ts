import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as addressApi from './api';
import type { MapAddress } from './api';
import { useMapAddressLookup } from './useMapAddressLookup';

const lookup = vi.fn();
beforeEach(() => {
  lookup.mockReset();
  vi.spyOn(addressApi, 'reverseMapAddress').mockImplementation(lookup);
});
const address: MapAddress = {
  country_code: 'sa',
  region: 'Riyadh',
  city: 'Riyadh',
  district: null,
  street: null,
  building_number: null,
  postal_code: null,
};

describe('Map address request lifecycle', () => {
  it('ignores a late result from an older pin even if the provider ignores cancellation', async () => {
    vi.useFakeTimers();
    let finishOld: (value: MapAddress) => void = () => undefined;
    lookup.mockReturnValueOnce(
      new Promise<MapAddress>((resolve) => {
        finishOld = resolve;
      }),
    );
    lookup.mockResolvedValueOnce({ ...address, city: 'Jeddah' });
    const first = vi.fn();
    const second = vi.fn();
    const { result } = renderHook(useMapAddressLookup);
    act(() => {
      result.current.lookup({ lat: 24, lng: 46 }, first);
    });
    await act(() => vi.advanceTimersByTimeAsync(600));
    act(() => {
      result.current.lookup({ lat: 21, lng: 39 }, second);
    });
    await act(() => vi.advanceTimersByTimeAsync(600));
    await act(async () => {
      finishOld(address);
      await Promise.resolve();
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({ ...address, city: 'Jeddah' });
    expect(result.current.status).toBe('filled');
  });

  it('makes no request after unmount or rapid pin changes before settling', async () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(useMapAddressLookup);
    const found = vi.fn();
    act(() => {
      result.current.lookup({ lat: 24, lng: 46 }, found);
    });
    await act(() => vi.advanceTimersByTimeAsync(300));
    act(() => {
      result.current.lookup({ lat: 21, lng: 39 }, found);
    });
    await act(() => vi.advanceTimersByTimeAsync(300));
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(lookup).not.toHaveBeenCalled();
  });

  it.each([
    { country_code: 'gb', expected: 'outside' },
    { country_code: null, expected: 'empty' },
  ])('does not fill a form for $country_code', async ({ country_code, expected }) => {
    vi.useFakeTimers();
    lookup.mockResolvedValueOnce({ ...address, country_code });
    const found = vi.fn();
    const { result } = renderHook(useMapAddressLookup);
    act(() => {
      result.current.lookup({ lat: 24, lng: 46 }, found);
    });
    await act(() => vi.advanceTimersByTimeAsync(600));
    expect(found).not.toHaveBeenCalled();
    expect(result.current.status).toBe(expected);
  });
});
