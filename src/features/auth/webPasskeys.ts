import { http, type Data, type Schemas } from '@/shared/api';

/** Binary fields in WebAuthn are base64url-encoded JSON over the API. */
type CreationOptionsJson = {
  challenge: string;
  rp: PublicKeyCredentialRpEntity;
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  attestation?: AttestationConveyancePreference;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  excludeCredentials?: Array<{
    id: string;
    type: PublicKeyCredentialType;
    transports?: AuthenticatorTransport[];
  }>;
};

type RequestOptionsJson = {
  challenge: string;
  rpId?: string;
  timeout?: number;
  userVerification?: UserVerificationRequirement;
  allowCredentials?: Array<{
    id: string;
    type: PublicKeyCredentialType;
    transports?: AuthenticatorTransport[];
  }>;
};

type Issued<T> = { challenge_id: string; options: T };
export type WebPasskey = {
  id: number;
  name: string;
  created_at: string;
  last_used_at: string | null;
};

export function webPasskeysSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials?.create === 'function' &&
    typeof navigator.credentials?.get === 'function'
  );
}

function base64UrlToBytes(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return bytes.buffer as ArrayBuffer;
}

function bytesToBase64Url(value: ArrayBuffer | null): string | null {
  if (value === null) return null;
  const bytes = new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function creationOptions(options: CreationOptionsJson): PublicKeyCredentialCreationOptions {
  return {
    ...options,
    challenge: base64UrlToBytes(options.challenge),
    user: { ...options.user, id: base64UrlToBytes(options.user.id) },
    excludeCredentials: options.excludeCredentials?.map((item) => ({
      ...item,
      id: base64UrlToBytes(item.id),
    })),
  };
}

function requestOptions(options: RequestOptionsJson): PublicKeyCredentialRequestOptions {
  return {
    ...options,
    challenge: base64UrlToBytes(options.challenge),
    allowCredentials: options.allowCredentials?.map((item) => ({
      ...item,
      id: base64UrlToBytes(item.id),
    })),
  };
}

function registrationCredential(credential: PublicKeyCredential) {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: bytesToBase64Url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment,
    response: {
      clientDataJSON: bytesToBase64Url(response.clientDataJSON),
      attestationObject: bytesToBase64Url(response.attestationObject),
      transports: response.getTransports?.() ?? [],
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}

function assertionCredential(credential: PublicKeyCredential) {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: bytesToBase64Url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment,
    response: {
      clientDataJSON: bytesToBase64Url(response.clientDataJSON),
      authenticatorData: bytesToBase64Url(response.authenticatorData),
      signature: bytesToBase64Url(response.signature),
      userHandle: bytesToBase64Url(response.userHandle),
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}

export async function webPasskeysEnabled(): Promise<boolean> {
  try {
    const result = await http.get<Data<{ enabled: boolean }>>('/auth/passkeys/status');
    return result.data.enabled === true;
  } catch {
    return false;
  }
}

export async function listWebPasskeys(): Promise<WebPasskey[]> {
  const response = await http.get<Data<WebPasskey[]>>('/me/passkeys');
  return response.data;
}

export async function registerWebPasskey(password: string, name: string): Promise<void> {
  if (!webPasskeysSupported()) throw new Error('Passkeys are not supported on this browser.');
  const issued = await http.post<Data<Issued<CreationOptionsJson>>>('/me/passkeys/options', {
    password,
  });
  const credential = await navigator.credentials.create({
    publicKey: creationOptions(issued.data.options),
  });
  if (!(credential instanceof PublicKeyCredential))
    throw new Error('Passkey registration cancelled.');

  await http.post('/me/passkeys', {
    challenge_id: issued.data.challenge_id,
    name,
    credential: registrationCredential(credential),
  });
}

export async function revokeWebPasskey(id: number, password: string): Promise<void> {
  await http.post(`/me/passkeys/${id}/revoke`, { password });
}

type PasskeyLoginReply = {
  token: string;
  user: Schemas['UserResource'];
  is_new_user: boolean;
};

export async function loginWithWebPasskey(deviceName: string): Promise<PasskeyLoginReply> {
  if (!webPasskeysSupported()) throw new Error('Passkeys are not supported on this browser.');
  const issued = await http.post<Data<Issued<RequestOptionsJson>>>('/auth/passkeys/options', {});
  const credential = await navigator.credentials.get({
    publicKey: requestOptions(issued.data.options),
  });
  if (!(credential instanceof PublicKeyCredential)) throw new Error('Passkey sign-in cancelled.');

  const response = await http.post<Data<PasskeyLoginReply>>('/auth/passkeys/verify', {
    challenge_id: issued.data.challenge_id,
    credential: assertionCredential(credential),
    device_name: deviceName,
  });
  return response.data;
}
