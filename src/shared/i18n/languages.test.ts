import { describe, expect, it } from 'vitest';
import { getDirection, isLanguage, resolveInitialLanguage } from './languages';

describe('resolveInitialLanguage', () => {
  it('prefers the saved choice over the device language', () => {
    expect(resolveInitialLanguage({ stored: 'en', deviceLanguage: 'ar-SA' })).toBe('en');
    expect(resolveInitialLanguage({ stored: 'ar', deviceLanguage: 'en-US' })).toBe('ar');
  });

  it('follows the device language when it is Arabic or English', () => {
    expect(resolveInitialLanguage({ stored: null, deviceLanguage: 'en-GB' })).toBe('en');
    expect(resolveInitialLanguage({ stored: null, deviceLanguage: 'ar-EG' })).toBe('ar');
    expect(resolveInitialLanguage({ stored: null, deviceLanguage: 'EN' })).toBe('en');
  });

  it('falls back to Arabic for other languages and unknown values', () => {
    expect(resolveInitialLanguage({ stored: null, deviceLanguage: 'fr-FR' })).toBe('ar');
    expect(resolveInitialLanguage({ stored: null, deviceLanguage: undefined })).toBe('ar');
    expect(resolveInitialLanguage({ stored: 'de', deviceLanguage: undefined })).toBe('ar');
  });
});

describe('language helpers', () => {
  it('maps Arabic to right-to-left and English to left-to-right', () => {
    expect(getDirection('ar')).toBe('rtl');
    expect(getDirection('en')).toBe('ltr');
  });

  it('recognises only supported languages', () => {
    expect(isLanguage('ar')).toBe(true);
    expect(isLanguage('en')).toBe(true);
    expect(isLanguage('fr')).toBe(false);
    expect(isLanguage(undefined)).toBe(false);
  });
});
