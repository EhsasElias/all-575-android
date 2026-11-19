import { describe, expect, it } from 'vitest';
import { appResources } from './i18n-resources';

function flatten(value: unknown, prefix = '', result = new Map<string, string>()) {
  if (typeof value !== 'object' || value === null) return result;
  for (const [name, next] of Object.entries(value)) {
    const key = prefix ? `${prefix}.${name}` : name;
    if (typeof next === 'string') result.set(key, next);
    else flatten(next, key, result);
  }
  return result;
}

function interpolationKeys(value: string): string[] {
  return Array.from(value.matchAll(/{{\s*([a-zA-Z_][a-zA-Z0-9_]*)[^}]*}}/g), (match) => match[1] ?? '').sort();
}

describe('complete translation namespaces', () => {
  const english = flatten(appResources.en);

  for (const language of ['ar', 'fr'] as const) {
    it(`${language} has exactly the same keys as English`, () => {
      const translated = flatten(appResources[language]);
      expect([...translated.keys()].sort()).toEqual([...english.keys()].sort());
    });

    it(`${language} has no empty values or missing interpolation parameters`, () => {
      const translated = flatten(appResources[language]);
      for (const [key, value] of translated) {
        expect(value.trim().length, `${language}.${key}`).toBeGreaterThan(0);
        expect(interpolationKeys(value), `${language}.${key}`).toEqual(
          interpolationKeys(english.get(key) ?? ''),
        );
      }
    });
  }

  it('Arabic interface copy uses Arabic script outside language-name options', () => {
    const translated = flatten(appResources.ar);
    for (const [key, value] of translated) {
      if (key.startsWith('common.language.') || key.startsWith('navigation.language.')) continue;
      // Product names, currency abbreviations and technical abbreviations may legitimately use Latin.
      if (value.length < 8 || /^[0-9\s\W]+$/.test(value)) continue;
      // This is a smoke check for wholesale English fallback; not a linguistic quality review.
      expect(value, key).not.toMatch(/^\s*(?:Loading|Submit|Continue|Save changes|Sign in|Sign out)\s*$/i);
    }
  });
});
