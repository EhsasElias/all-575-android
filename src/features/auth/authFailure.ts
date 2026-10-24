import { isApiError, type ApiError } from '@/shared/api';

/** Why a sign-in request did not work, in the terms the screens need. Raw server text is never shown. */
export type AuthFailure =
  | { kind: 'otp-invalid'; attemptsRemaining: number | null }
  | { kind: 'otp-expired' }
  | { kind: 'otp-locked' }
  | { kind: 'otp-cooldown'; retryAfterSeconds: number | null }
  | { kind: 'rate-limited'; retryAfterSeconds: number | null }
  | { kind: 'account-inactive' }
  | { kind: 'field'; field: 'destination' | 'code' }
  | { kind: 'offline' }
  | { kind: 'unknown' };

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function classifyValidation(error: ApiError): AuthFailure {
  if ('destination' in error.fieldErrors) return { kind: 'field', field: 'destination' };
  if ('code' in error.fieldErrors) return { kind: 'field', field: 'code' };
  // A malformed challenge id is one the server cannot know: the same as an expired code.
  return 'challenge_id' in error.fieldErrors ? { kind: 'otp-expired' } : { kind: 'unknown' };
}

function classifyByStatus(error: ApiError): AuthFailure {
  switch (error.kind) {
    case 'network':
    case 'timeout':
      return { kind: 'offline' };
    case 'rate-limited':
      return { kind: 'rate-limited', retryAfterSeconds: error.retryAfterSeconds };
    case 'validation':
      return classifyValidation(error);
    case 'forbidden':
    case 'not-found':
    case 'server':
    case 'unauthenticated':
    case 'unexpected':
      return { kind: 'unknown' };
  }
}

/** Turns any failure of requesting or verifying a code into one of the cases above. */
export function classifyAuthFailure(error: unknown): AuthFailure {
  if (!isApiError(error)) return { kind: 'unknown' };

  switch (error.code) {
    case 'otp_invalid':
      return {
        kind: 'otp-invalid',
        attemptsRemaining: readNumber(error.details.attempts_remaining),
      };
    case 'otp_expired':
      return { kind: 'otp-expired' };
    case 'otp_locked':
      return { kind: 'otp-locked' };
    case 'otp_cooldown':
      return {
        kind: 'otp-cooldown',
        retryAfterSeconds: error.retryAfterSeconds ?? readNumber(error.details.retry_after),
      };
    case 'account_inactive':
      return { kind: 'account-inactive' };
    case null:
    default:
      return classifyByStatus(error);
  }
}
