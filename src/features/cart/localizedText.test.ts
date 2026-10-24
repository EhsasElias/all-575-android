import { describe, expect, it } from 'vitest';
import { fromApiName, pickText } from './localizedText';

describe("picking the text in the customer's language", () => {
  const name = { ar: 'بسكويت', en: 'Biscuits' };

  it('gives the language asked for', () => {
    expect(pickText(name, 'ar')).toBe('بسكويت');
    expect(pickText(name, 'en')).toBe('Biscuits');
  });

  it('falls back to the other language when one side is empty', () => {
    expect(pickText({ ar: '', en: 'Biscuits' }, 'ar')).toBe('Biscuits');
    expect(pickText({ ar: 'بسكويت', en: '  ' }, 'en')).toBe('بسكويت');
  });
});

describe('reading a name from the API', () => {
  it('is null when there is no name', () => {
    expect(fromApiName(null)).toBeNull();
    expect(fromApiName({ ar: null, en: null })).toBeNull();
  });

  it('keeps a complete name as it is', () => {
    expect(fromApiName({ ar: 'أزرق', en: 'Blue' })).toEqual({ ar: 'أزرق', en: 'Blue' });
  });

  it('fills a missing language from the other one', () => {
    expect(fromApiName({ ar: null, en: 'Blue' })).toEqual({ ar: 'Blue', en: 'Blue' });
    expect(fromApiName({ ar: 'أزرق', en: null })).toEqual({ ar: 'أزرق', en: 'أزرق' });
  });
});
