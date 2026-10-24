import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getPreference, setPreference } from '@/shared/storage';
import { riyadh } from '../testData';
import {
  isDeliveryZone,
  parseDeliveryZone,
  saveDeliveryZone,
  useSavedDeliveryZone,
} from './deliveryZone';

const zone = { id: riyadh.id, name: riyadh.name };

describe('isDeliveryZone', () => {
  it('accepts an id with an Arabic and an English name', () => {
    expect(isDeliveryZone(zone)).toBe(true);
  });

  it.each([
    ['null', null],
    ['a string', 'riyadh'],
    ['an array', [1, 'a', 'b']],
    ['no name', { id: 1 }],
    ['a name without Arabic', { id: 1, name: { en: 'Riyadh' } }],
    ['a name that is not text', { id: 1, name: { ar: 1, en: 2 } }],
    ['a string id', { id: '1', name: zone.name }],
    ['a zero id', { id: 0, name: zone.name }],
    ['a negative id', { id: -3, name: zone.name }],
    ['a fractional id', { id: 1.5, name: zone.name }],
  ])('rejects %s', (_label, value) => {
    expect(isDeliveryZone(value)).toBe(false);
  });
});

describe('parseDeliveryZone', () => {
  it('reads what was saved', () => {
    expect(parseDeliveryZone(JSON.stringify(zone))).toEqual(zone);
  });

  it('treats missing, broken or foreign data as no zone', () => {
    expect(parseDeliveryZone(null)).toBeNull();
    expect(parseDeliveryZone('{not json')).toBeNull();
    expect(parseDeliveryZone('"Riyadh"')).toBeNull();
    expect(parseDeliveryZone(JSON.stringify({ id: 1, name: 'Riyadh' }))).toBeNull();
  });
});

describe('saved delivery zone', () => {
  it('stores only the id and the names, never anything else', () => {
    const fullResource = { ...zone, delivery_fee: 1000, free_delivery_threshold: 5000 };

    saveDeliveryZone(fullResource);

    expect(JSON.parse(getPreference('deliveryZone') ?? 'null')).toEqual(zone);
  });

  it('tells every screen that shows it when it changes', () => {
    const { result } = renderHook(() => useSavedDeliveryZone());
    expect(result.current).toBeNull();

    act(() => {
      saveDeliveryZone(zone);
    });

    expect(result.current).toEqual(zone);
  });

  it('starts from the stored choice and ignores a stored value it cannot read', () => {
    setPreference('deliveryZone', JSON.stringify(zone));
    expect(renderHook(() => useSavedDeliveryZone()).result.current).toEqual(zone);

    setPreference('deliveryZone', '{"id":"oops"}');
    expect(renderHook(() => useSavedDeliveryZone()).result.current).toBeNull();
  });
});
