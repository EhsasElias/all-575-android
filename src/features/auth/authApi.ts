import { errorCode, http, isApiError, type Data, type Schemas } from '@/shared/api';
import type { operations } from '@/shared/api/schema';
import type { Contact } from './contact';

type IssuedChallenge =
  operations['auth.requestOtp']['responses'][200]['content']['application/json']['data'];
type VerifiedLogin =
  operations['auth.verifyOtp']['responses'][200]['content']['application/json']['data'];

/** The Terms and Privacy versions the customer saw and accepted. */
export type LegalVersions = { terms: string; privacy: string };

export type ConsentChoice = LegalVersions & { marketing: boolean };

export type VerifyInput = {
  challengeId: string;
  code: string;
  deviceName: string;
  /** Only sent after the server asked for it (`consent_required`). */
  consent: ConsentChoice | null;
};

export type VerifyOutcome =
  | { kind: 'verified'; token: string; user: Schemas['UserResource']; isNewUser: boolean }
  | { kind: 'consent-required'; versions: LegalVersions | null };

export async function requestOtp({ channel, destination }: Contact): Promise<IssuedChallenge> {
  const body: Schemas['RequestOtpRequest'] = { channel, destination };
  return (await http.post<Data<IssuedChallenge>>('/auth/otp/request', body)).data;
}

function readVersions(details: Readonly<Record<string, unknown>>): LegalVersions | null {
  const { terms_version: terms, privacy_version: privacy } = details;
  return typeof terms === 'string' && typeof privacy === 'string' ? { terms, privacy } : null;
}

function verifyBody({
  challengeId,
  code,
  deviceName,
  consent,
}: VerifyInput): Schemas['VerifyOtpRequest'] {
  const body: Schemas['VerifyOtpRequest'] = {
    challenge_id: challengeId,
    code,
    device_name: deviceName,
  };
  if (consent === null) return body;
  return {
    ...body,
    consents: {
      terms_version: consent.terms,
      privacy_version: consent.privacy,
      marketing: consent.marketing,
    },
  };
}

/**
 * Checks the code. A refusal that only asks for consent is an expected answer here, not a failure:
 * the same code is sent again together with the choices, so the customer never needs a new one.
 */
export async function verifyOtp(input: VerifyInput): Promise<VerifyOutcome> {
  try {
    const { data } = await http.post<Data<VerifiedLogin>>('/auth/otp/verify', verifyBody(input));
    return { kind: 'verified', token: data.token, user: data.user, isNewUser: data.is_new_user };
  } catch (error) {
    if (isApiError(error) && errorCode(error) === 'consent_required') {
      return { kind: 'consent-required', versions: readVersions(error.details) };
    }
    throw error;
  }
}
