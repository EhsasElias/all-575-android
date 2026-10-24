import type { Schemas } from '@/shared/api';
import { testUser } from '@/test/fixtures';

/** 26 characters, like the server's challenge ids. */
export const CHALLENGE_ID = '01m5qen43309c0q2mykgh76jk7';
export const CODE = '123456';
export const TOKEN = 'a575_signed_in_token';

export const issuedChallenge = {
  body: { data: { challenge_id: CHALLENGE_ID, expires_in: 300, resend_after: 60 } },
  status: 202,
};

export function verifiedLogin(
  options: { isNewUser?: boolean; user?: Schemas['UserResource'] } = {},
) {
  const { isNewUser = false, user = testUser } = options;
  return {
    status: isNewUser ? 201 : 200,
    body: {
      data: {
        token: TOKEN,
        token_type: 'Bearer',
        expires_at: '2026-11-23T10:00:00.000000Z',
        is_new_user: isNewUser,
        user,
      },
    },
  };
}

/** What the server answers when the account is new (or the legal texts changed) and no consent came along. */
export function consentRequired(versions: { terms?: string; privacy?: string } = {}) {
  return {
    status: 422,
    body: {
      message: 'Accept the current Terms and Privacy Policy to continue.',
      code: 'consent_required',
      terms_version: versions.terms ?? '2026-10-01',
      privacy_version: versions.privacy ?? '2026-10-01',
    },
  };
}

export function businessRefusal(code: string, status: number, extra: Record<string, unknown> = {}) {
  return { status, body: { message: 'Server wording that must never be shown', code, ...extra } };
}
