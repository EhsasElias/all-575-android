import { describe, expect, it } from 'vitest';
import { emptyAddressValues, type AddressValues } from './addressFields';
import {
  clearProblem,
  firstProblemKey,
  isSaudiMobile,
  normalizeValues,
  problemsFromServer,
  toLatinDigits,
  validateAddress,
} from './splRules';
import type { MapPin } from './mapTypes';
import { RIYADH_PIN } from './testData';

const valid: AddressValues = {
  ...emptyAddressValues,
  recipientName: 'Sara',
  recipientPhone: '0512345678',
  region: 'Riyadh',
  city: 'Riyadh',
  district: 'Al Olaya',
  street: 'King Fahd Rd',
  buildingNumber: '1234',
  additionalNumber: '5678',
  postalCode: '12211',
};

const check = (changes: Partial<AddressValues>, pin: MapPin | null = RIYADH_PIN) =>
  validateAddress(normalizeValues({ ...valid, ...changes }), pin);

describe('validateAddress', () => {
  it('accepts a complete address with a pin', () => {
    expect(check({})).toEqual({});
  });

  it('accepts the optional fields when they are filled in right', () => {
    expect(
      check({
        label: 'Home',
        shortAddress: 'RRRD2929',
        unit: '4',
        floor: '2',
        deliveryNotes: 'Call',
      }),
    ).toEqual({});
  });

  it.each([
    'recipientName',
    'recipientPhone',
    'region',
    'city',
    'district',
    'street',
    'buildingNumber',
    'additionalNumber',
    'postalCode',
  ] as const)('requires %s', (field) => {
    expect(check({ [field]: '   ' })[field]).toBe('required');
  });

  it.each([
    ['label', 41],
    ['recipientName', 101],
    ['region', 81],
    ['city', 81],
    ['district', 81],
    ['street', 121],
    ['unit', 21],
    ['floor', 21],
    ['deliveryNotes', 301],
  ] as const)('limits %s to the length the API allows', (field, tooLong) => {
    expect(check({ [field]: 'x'.repeat(tooLong) })[field]).toBe('tooLong');
    expect(check({ [field]: 'x'.repeat(tooLong - 1) })[field]).toBeUndefined();
  });

  it.each([
    ['buildingNumber', '123'],
    ['buildingNumber', '12345'],
    ['buildingNumber', '12a4'],
    ['additionalNumber', '123'],
    ['additionalNumber', '12345'],
    ['additionalNumber', 'abcd'],
    ['postalCode', '1234'],
    ['postalCode', '123456'],
    ['postalCode', '1221a'],
  ] as const)('rejects %s = %s', (field, value) => {
    expect(check({ [field]: value })[field]).toBe('invalid');
  });

  it.each(['RR2929', 'RRRD292', 'RRRD29290', '1234RRRD', 'RRR12929', 'RRRD-2929'])(
    'rejects the short address %s',
    (shortAddress) => {
      expect(check({ shortAddress }).shortAddress).toBe('invalid');
    },
  );

  it.each(['RRRD2929', 'rrrd2929', 'RRRD 2929', ' abcd1234 '])(
    'accepts the short address %s as typed',
    (shortAddress) => {
      expect(check({ shortAddress }).shortAddress).toBeUndefined();
    },
  );

  it('requires the pin', () => {
    expect(check({}, null)).toEqual({ pin: 'required' });
  });

  it.each([
    { lat: 91, lng: 46 },
    { lat: -91, lng: 46 },
    { lat: 24, lng: 181 },
    { lat: 24, lng: -181 },
    { lat: Number.NaN, lng: 46 },
  ])('rejects the pin %o', (pin) => {
    expect(check({}, pin).pin).toBe('required');
  });

  it('reports every problem at once', () => {
    const problems = check({ recipientName: '', buildingNumber: '1', postalCode: '' }, null);
    expect(Object.keys(problems).sort()).toEqual([
      'buildingNumber',
      'pin',
      'postalCode',
      'recipientName',
    ]);
  });
});

describe('Saudi mobile numbers', () => {
  it.each([
    '0512345678',
    '512345678',
    '+966512345678',
    '966512345678',
    '00966512345678',
    '05 1234 5678',
    '0512-345-678',
    '(051) 234 5678',
    '+966 5 1234 5678',
    '٠٥١٢٣٤٥٦٧٨',
  ])('accepts %s', (phone) => {
    expect(isSaudiMobile(phone)).toBe(true);
  });

  it.each([
    '',
    '0412345678',
    '051234567',
    '05123456789',
    '+9660512345678',
    '+971512345678',
    '0512345678x',
    'five',
  ])('rejects %s', (phone) => {
    expect(isSaudiMobile(phone)).toBe(false);
  });
});

describe('normalizeValues', () => {
  it('trims text and converts Arabic digits in the number fields', () => {
    const normalized = normalizeValues({
      ...valid,
      street: '  King Fahd Rd ',
      buildingNumber: '١٢٣٤',
      additionalNumber: '۵۶۷۸',
      postalCode: ' ١٢٢١١ ',
      shortAddress: 'rrrd ٢٩٢٩',
    });

    expect(normalized.street).toBe('King Fahd Rd');
    expect(normalized.buildingNumber).toBe('1234');
    expect(normalized.additionalNumber).toBe('5678');
    expect(normalized.postalCode).toBe('12211');
    expect(normalized.shortAddress).toBe('RRRD2929');
  });

  it('converts every Arabic-Indic and Persian digit', () => {
    expect(toLatinDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
    expect(toLatinDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
    expect(toLatinDigits('abc 12')).toBe('abc 12');
  });
});

describe('problem helpers', () => {
  it('puts a server 422 next to the same inputs', () => {
    expect(
      problemsFromServer({ building_number: ['x'], recipient_phone: ['y'], lat: ['z'] }),
    ).toEqual({ buildingNumber: 'invalid', recipientPhone: 'invalid', pin: 'required' });
  });

  it('finds the first problem in the order of the form, with the pin last', () => {
    expect(firstProblemKey({ pin: 'required', city: 'required', label: 'tooLong' })).toBe('label');
    expect(firstProblemKey({ pin: 'required' })).toBe('pin');
    expect(firstProblemKey({})).toBeNull();
  });

  it('clears one problem and keeps the rest', () => {
    expect(clearProblem({ city: 'required', pin: 'required' }, 'city')).toEqual({
      pin: 'required',
    });
  });
});
