import { describe, expect, it } from 'vitest';
import { getDirection, isLanguage, resolveInitialLanguage, textLanguages } from './languages';

describe('resolveInitialLanguage', () => {
  it('prefers the saved choice over the device language', () => {
    expect(resolveInitialLanguage({ stored: 'en', deviceLanguage: 'ar-SA' })).toBe('en');
    expect(resolveInitialLanguage({ stored: 'ar', deviceLanguage: 'en-US' })).toBe('ar');
    expect(resolveInitialLanguage({ stored: 'fr', deviceLanguage: 'ar-SA' })).toBe('fr');
  });

  it('follows the device language when it is Arabic, English or French', () => {
    expect(resolveInitialLanguage({ stored: null, deviceLanguage: 'en-GB' })).toBe('en');
    expect(resolveInitialLanguage({ stored: null, deviceLanguage: 'ar-EG' })).toBe('ar');
    expect(resolveInitialLanguage({ stored: null, deviceLanguage: 'EN' })).toBe('en');
    expect(resolveInitialLanguage({ stored: null, deviceLanguage: 'fr-FR' })).toBe('fr');
    expect(resolveInitialLanguage({ stored: null, deviceLanguage: 'fr-CA' })).toBe('fr');
  });

  it('falls back to Arabic for other languages and unknown values', () => {
    expect(resolveInitialLanguage({ stored: null, deviceLanguage: 'de-DE' })).toBe('ar');
    expect(resolveInitialLanguage({ stored: null, deviceLanguage: undefined })).toBe('ar');
    expect(resolveInitialLanguage({ stored: 'de', deviceLanguage: undefined })).toBe('ar');
  });
});

describe('language helpers', () => {
  it('maps Arabic to right-to-left, English and French to left-to-right', () => {
    expect(getDirection('ar')).toBe('rtl');
    expect(getDirection('en')).toBe('ltr');
    expect(getDirection('fr')).toBe('ltr');
  });

  it('recognises only supported languages', () => {
    expect(isLanguage('ar')).toBe(true);
    expect(isLanguage('en')).toBe(true);
    expect(isLanguage('fr')).toBe(true);
    expect(isLanguage('de')).toBe(false);
    expect(isLanguage(undefined)).toBe(false);
  });

  it('reads a text the server only has in Arabic and English in the next best language', () => {
    expect(textLanguages('ar')).toEqual(['ar', 'en']);
    expect(textLanguages('en')).toEqual(['en', 'ar']);
    expect(textLanguages('fr')).toEqual(['fr', 'en', 'ar']);
  });
});
