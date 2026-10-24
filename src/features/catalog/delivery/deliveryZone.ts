import { useSyncExternalStore } from 'react';
import { getPreference, setPreference } from '@/shared/storage';

/** The delivery area the customer shops for. Availability depends on it. */
export type DeliveryZone = {
  id: number;
  name: { ar: string; en: string };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isDeliveryZone(value: unknown): value is DeliveryZone {
  if (!isRecord(value) || !isRecord(value.name)) return false;
  return (
    typeof value.id === 'number' &&
    Number.isSafeInteger(value.id) &&
    value.id > 0 &&
    typeof value.name.ar === 'string' &&
    typeof value.name.en === 'string'
  );
}

/** Reads the saved choice; anything that is not a valid zone (old format, hand-edited storage) counts as none. */
export function parseDeliveryZone(raw: string | null): DeliveryZone | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isDeliveryZone(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();
let lastRaw: string | null = null;
let lastZone: DeliveryZone | null = null;

function readSavedZone(): DeliveryZone | null {
  const raw = getPreference('deliveryZone');
  // useSyncExternalStore needs the same object back until the stored text changes.
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastZone = parseDeliveryZone(raw);
  }
  return lastZone;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Remembers the area (only its id and name, never where the customer was) and tells every screen showing it. */
export function saveDeliveryZone(zone: DeliveryZone): void {
  const { id, name } = zone;
  setPreference('deliveryZone', JSON.stringify({ id, name: { ar: name.ar, en: name.en } }));
  for (const listener of listeners) listener();
}

export function useSavedDeliveryZone(): DeliveryZone | null {
  return useSyncExternalStore(subscribe, readSavedZone);
}
