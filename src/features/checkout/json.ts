export type Json = Record<string, unknown>;

export function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function asInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) ? value : null;
}

export function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

/** Every item read with `read`, or null when the value is not a list or any item is malformed. */
export function readList<T>(value: unknown, read: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) return null;
  const items: T[] = [];
  for (const raw of value) {
    const item = read(raw);
    if (item === null) return null;
    items.push(item);
  }
  return items;
}
