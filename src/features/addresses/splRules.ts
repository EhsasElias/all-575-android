import {
  ADDRESS_FIELDS,
  MAX_LENGTH,
  REQUIRED_FIELDS,
  API_FIELD,
  type AddressField,
  type AddressValues,
} from './addressFields';
import type { FieldErrors } from '@/shared/api';
import type { MapPin } from './mapTypes';

/** Saudi National Address (SPL) rules, mirroring what the API validates. */
export type FieldProblem = 'required' | 'tooLong' | 'invalid';
export type ProblemKey = AddressField | 'pin';
export type AddressProblems = Partial<Record<ProblemKey, FieldProblem>>;

const BUILDING_NUMBER = /^\d{4}$/;
const ADDITIONAL_NUMBER = /^\d{4}$/;
const POSTAL_CODE = /^\d{5}$/;
const SHORT_ADDRESS = /^[A-Za-z]{4}\d{4}$/;
// A Saudi mobile is 5 and eight digits, with an optional 0 or country code (+966, 00966, 966) in front.
const SAUDI_MOBILE = /^(?:(?:\+|00)?966|0)?5\d{8}$/;
const PHONE_SEPARATORS = /[\s\-().]/g;

const ARABIC_INDIC_ZERO = 0x0660;
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0;

/** Arabic keyboards type ٠-٩; the API only accepts 0-9 (except in phone numbers), so convert them. */
export function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const zero =
      code >= EXTENDED_ARABIC_INDIC_ZERO ? EXTENDED_ARABIC_INDIC_ZERO : ARABIC_INDIC_ZERO;
    return String(code - zero);
  });
}

export function isSaudiMobile(raw: string): boolean {
  return SAUDI_MOBILE.test(toLatinDigits(raw).replace(PHONE_SEPARATORS, ''));
}

const NUMERIC_FIELDS = [
  'buildingNumber',
  'additionalNumber',
  'postalCode',
  'shortAddress',
] as const satisfies readonly AddressField[];

/** Trims everything and tidies the pattern fields, so "rrrd 2929" and "١٢٣٤" are accepted as typed. */
export function normalizeValues(values: AddressValues): AddressValues {
  const trimmed = { ...values };
  for (const field of ADDRESS_FIELDS) trimmed[field] = values[field].trim();
  for (const field of NUMERIC_FIELDS) {
    trimmed[field] = toLatinDigits(trimmed[field]).replace(/\s+/g, '');
  }
  trimmed.shortAddress = trimmed.shortAddress.toUpperCase();
  return trimmed;
}

const PATTERNS = {
  recipientPhone: isSaudiMobile,
  buildingNumber: (value: string) => BUILDING_NUMBER.test(value),
  additionalNumber: (value: string) => ADDITIONAL_NUMBER.test(value),
  postalCode: (value: string) => POSTAL_CODE.test(value),
  shortAddress: (value: string) => SHORT_ADDRESS.test(value),
} as const satisfies Partial<Record<AddressField, (value: string) => boolean>>;

export function isPatternField(field: string): field is keyof typeof PATTERNS {
  return field in PATTERNS;
}

function problemFor(field: AddressField, value: string): FieldProblem | null {
  if (value === '') return REQUIRED_FIELDS.has(field) ? 'required' : null;
  const max = MAX_LENGTH[field];
  if (max !== undefined && value.length > max) return 'tooLong';
  if (isPatternField(field) && !PATTERNS[field](value)) return 'invalid';
  return null;
}

export function isValidPin(pin: MapPin | null): pin is MapPin {
  return (
    pin !== null &&
    Number.isFinite(pin.lat) &&
    Number.isFinite(pin.lng) &&
    Math.abs(pin.lat) <= 90 &&
    Math.abs(pin.lng) <= 180
  );
}

/** Expects normalized values. An empty object means the form can be sent. */
export function validateAddress(values: AddressValues, pin: MapPin | null): AddressProblems {
  const problems: AddressProblems = {};
  for (const field of ADDRESS_FIELDS) {
    const problem = problemFor(field, values[field]);
    if (problem !== null) problems[field] = problem;
  }
  if (!isValidPin(pin)) problems.pin = 'required';
  return problems;
}

/** A 422 from the server, put next to the same inputs. The server's wording is never shown. */
export function problemsFromServer(fieldErrors: FieldErrors): AddressProblems {
  const problems: AddressProblems = {};
  for (const field of ADDRESS_FIELDS) {
    if (API_FIELD[field] in fieldErrors) problems[field] = 'invalid';
  }
  if ('lat' in fieldErrors || 'lng' in fieldErrors) problems.pin = 'required';
  return problems;
}

/** The first field with a problem, in the order the form shows them (the pin is last). */
export function firstProblemKey(problems: AddressProblems): ProblemKey | null {
  return (
    ADDRESS_FIELDS.find((field) => problems[field] !== undefined) ?? (problems.pin ? 'pin' : null)
  );
}

/** The problems without `key`: typing in a field clears its message. */
export function clearProblem(problems: AddressProblems, key: ProblemKey): AddressProblems {
  const kept: AddressProblems = {};
  for (const name of [...ADDRESS_FIELDS, 'pin'] as const) {
    const problem = problems[name];
    if (name !== key && problem !== undefined) kept[name] = problem;
  }
  return kept;
}
