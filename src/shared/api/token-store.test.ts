import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSecureTokenStore, type SecureKeyValueStorage } from './secure-token-store';
import { createMemoryTokenStore, createTokenStore } from './token-store';

function createFakeSecureStorage() {
  const items = new Map<string, string>();
  const storage: SecureKeyValueStorage = {
    getItem: (key) => Promise.resolve(items.get(key) ?? null),
    setItem: (key, value) => {
      items.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key) => {
      items.delete(key);
      return Promise.resolve();
    },
  };
  return { storage, items };
}

function storedValues(storage: Storage): string[] {
  return Array.from({ length: storage.length }, (_, index) => storage.key(index) ?? '').map(
    (key) => storage.getItem(key) ?? '',
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('memory token store', () => {
  it('holds a token until it is cleared', async () => {
    const store = createMemoryTokenStore();
    await expect(store.get()).resolves.toBeNull();

    await store.set('token-1');
    await expect(store.get()).resolves.toBe('token-1');

    await store.clear();
    await expect(store.get()).resolves.toBeNull();
  });

  it('keeps separate tokens per store', async () => {
    const first = createMemoryTokenStore();
    const second = createMemoryTokenStore();

    await first.set('only-in-first');

    await expect(second.get()).resolves.toBeNull();
  });

  it('never touches localStorage, sessionStorage or cookies', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const cookie = vi.spyOn(document, 'cookie', 'set');
    const store = createMemoryTokenStore();

    await store.set('secret-token');
    await store.clear();

    expect(setItem).not.toHaveBeenCalled();
    expect(cookie).not.toHaveBeenCalled();
    expect(storedValues(localStorage)).not.toContain('secret-token');
    expect(storedValues(sessionStorage)).not.toContain('secret-token');
  });
});

describe('secure token store', () => {
  it('keeps the token in the native secure storage', async () => {
    const { storage, items } = createFakeSecureStorage();
    const store = createSecureTokenStore(() => Promise.resolve(storage));

    await store.set('native-token');

    await expect(store.get()).resolves.toBe('native-token');
    expect([...items.values()]).toEqual(['native-token']);

    await store.clear();
    await expect(store.get()).resolves.toBeNull();
    expect(items.size).toBe(0);
  });

  it('does not load the native plugin until it is used', () => {
    const loadStorage = vi.fn(() => Promise.resolve(createFakeSecureStorage().storage));

    createSecureTokenStore(loadStorage);

    expect(loadStorage).not.toHaveBeenCalled();
  });
});

describe('createTokenStore', () => {
  it('uses the in-memory store on the web', async () => {
    const store = createTokenStore();

    await store.set('web-token');

    await expect(store.get()).resolves.toBe('web-token');
    expect(storedValues(localStorage)).not.toContain('web-token');
  });
});
