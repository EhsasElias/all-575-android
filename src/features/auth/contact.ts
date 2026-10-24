import type { Schemas } from '@/shared/api';

export type Channel = Schemas['OtpChannel'];

export type Contact = { channel: Channel; destination: string };

export type ContactProblem = 'required' | 'invalid';

export type ContactCheck =
  { ok: true; destination: string } | { ok: false; problem: ContactProblem };

const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const MAX_DESTINATION_LENGTH = 255;

// Same shapes the server accepts: 05XXXXXXXX, 5XXXXXXXX, 9665XXXXXXXX, +9665XXXXXXXX, 009665XXXXXXXX.
const SAUDI_MOBILE = /^(?:(?:\+|00)?966|0)?(5\d{8})$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Arabic keyboards type Arabic-Indic digits; the server reads Latin ones. */
export function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (digit) => String(ARABIC_INDIC_DIGITS.indexOf(digit)));
}

function checkPhone(raw: string): ContactCheck {
  const compact = toLatinDigits(raw).replace(/[\s\-().]/g, '');
  if (compact === '') return { ok: false, problem: 'required' };
  return SAUDI_MOBILE.test(compact)
    ? { ok: true, destination: compact }
    : { ok: false, problem: 'invalid' };
}

function checkEmail(raw: string): ContactCheck {
  const email = raw.trim().toLowerCase();
  if (email === '') return { ok: false, problem: 'required' };
  return EMAIL.test(email) && email.length <= MAX_DESTINATION_LENGTH
    ? { ok: true, destination: email }
    : { ok: false, problem: 'invalid' };
}

/** Checks what the customer typed before it is sent. The server validates again and normalizes. */
export function checkContact(channel: Channel, raw: string): ContactCheck {
  return channel === 'phone' ? checkPhone(raw) : checkEmail(raw);
}

/** One spelling per person, so `0512345678` and `+966 51 234 5678` count as the same destination. */
export function canonicalDestination({ channel, destination }: Contact): string {
  if (channel === 'email') return destination.trim().toLowerCase();
  const subscriber = SAUDI_MOBILE.exec(toLatinDigits(destination).replace(/[\s\-().]/g, ''))?.[1];
  return subscriber === undefined ? destination : `+966${subscriber}`;
}

export function isSameContact(first: Contact, second: Contact): boolean {
  return (
    first.channel === second.channel && canonicalDestination(first) === canonicalDestination(second)
  );
}
