import { describe, expect, it, vi } from 'vitest';
import { getPreference, loadPreferences, setPreference } from '@/shared/storage';
import { createMemoryPreferences } from '@/test/memoryPreferences';
import { guestCartStore } from './guestCartStore';
import { BISCUITS, CHOCOLATE, guestLine } from './testData';

describe('the guest cart store', () => {
  it('starts empty', () => {
    expect(guestCartStore.getSnapshot()).toEqual([]);
    expect(guestCartStore.getItemCount()).toBe(0);
  });

  it('keeps the lines in the guestCart preference as JSON', () => {
    guestCartStore.write([guestLine(BISCUITS, 2)]);

    const stored: unknown = JSON.parse(getPreference('guestCart') ?? 'null');
    expect(stored).toEqual({ version: 1, lines: [guestLine(BISCUITS, 2)] });
  });

  it('tells subscribers when the lines change, and stops after they unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = guestCartStore.subscribe(listener);

    guestCartStore.write([guestLine(BISCUITS, 1)]);
    guestCartStore.clear();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    guestCartStore.write([guestLine(CHOCOLATE, 1)]);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('gives React the same snapshot until the lines change', () => {
    guestCartStore.write([guestLine(BISCUITS, 2)]);

    expect(guestCartStore.getSnapshot()).toBe(guestCartStore.getSnapshot());

    const before = guestCartStore.getSnapshot();
    guestCartStore.write([guestLine(BISCUITS, 3)]);
    expect(guestCartStore.getSnapshot()).not.toBe(before);
  });

  it('counts items, not lines', () => {
    guestCartStore.write([guestLine(BISCUITS, 2), guestLine(CHOCOLATE, 5)]);

    expect(guestCartStore.getItemCount()).toBe(7);
  });

  it('reads a corrupted preference as an empty cart, and the next write replaces it', () => {
    setPreference('guestCart', '{"version":1,"lines":"oops');

    expect(guestCartStore.getSnapshot()).toEqual([]);

    guestCartStore.write([guestLine(BISCUITS, 1)]);
    expect(guestCartStore.getSnapshot()).toEqual([guestLine(BISCUITS, 1)]);
  });

  it('follows the preferences when they are loaded again', async () => {
    guestCartStore.write([guestLine(BISCUITS, 4)]);
    await loadPreferences(createMemoryPreferences());

    expect(guestCartStore.getSnapshot()).toEqual([]);
  });
});
