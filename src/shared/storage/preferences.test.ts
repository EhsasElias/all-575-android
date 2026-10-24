import { describe, expect, it } from 'vitest';
import { createMemoryPreferences } from '@/test/memoryPreferences';
import { getPreference, loadPreferences, setPreference } from './preferences';

describe('preferences', () => {
  it('reads saved values once at startup and then answers synchronously', async () => {
    await loadPreferences(createMemoryPreferences({ language: 'en', welcomeSeen: 'true' }));

    expect(getPreference('language')).toBe('en');
    expect(getPreference('welcomeSeen')).toBe('true');
  });

  it('returns null for values that were never saved', async () => {
    await loadPreferences(createMemoryPreferences());

    expect(getPreference('language')).toBeNull();
  });

  it('writes through to storage and updates the cache immediately', async () => {
    const backend = createMemoryPreferences();
    await loadPreferences(backend);

    setPreference('language', 'ar');

    expect(getPreference('language')).toBe('ar');
    await expect(backend.get('language')).resolves.toBe('ar');
  });

  it('starts with defaults when storage cannot be read', async () => {
    await loadPreferences({
      get: () => Promise.reject(new Error('storage unavailable')),
      set: () => Promise.resolve(),
    });

    expect(getPreference('language')).toBeNull();
  });

  it('keeps the value for this session when a write fails', async () => {
    await loadPreferences({
      get: () => Promise.resolve(null),
      set: () => Promise.reject(new Error('disk full')),
    });

    setPreference('welcomeSeen', 'true');
    await Promise.resolve();

    expect(getPreference('welcomeSeen')).toBe('true');
  });
});
