import { toLatinDigits } from './contact';

export const OTP_LENGTH = 6;

/** Keeps only the digits, so a pasted "123 456" or "١٢٣٤٥٦" becomes 123456. */
export function sanitizeCode(raw: string): string {
  return toLatinDigits(raw).replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export function isCompleteCode(code: string): boolean {
  return code.length === OTP_LENGTH;
}
