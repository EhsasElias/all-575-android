# Web passkeys / browser fingerprint: implementation gate

The account page now displays Security & sign-in on web and native. The
native application already supports enabling device biometric unlock through
the device security APIs; the web build **does not** yet enroll or authenticate
passkeys.

Do not call `navigator.credentials.create` or `get` against the existing
email/password or OTP endpoints. Browser biometrics require a WebAuthn
relying party implementation on the Laravel backend.

## Backend requirements before enabling web registration

1. Use a maintained WebAuthn server library, with locked dependencies and
   automated tests; do not hand-roll COSE/CBOR or signature verification.
2. Configure a relying-party ID of `market575.com`, canonical origin
   `https://market575.com`, and an explicit policy for subdomains.
3. Require the user's current authenticated session **and recent re-auth**
   to enroll, list or revoke credentials.
4. Issue cryptographically random, single-use, short-lived registration and
   authentication challenges. Bind challenges to user/session and intended
   operation; expire them atomically after use.
5. Verify origin, rpIdHash, challenge, type, public-key signature, UV/UP flags,
   authenticator data and credential owner. Apply the chosen counter policy.
6. Persist credential IDs, public keys and metadata only; never store
   fingerprints or other biometric templates.
7. Enforce unique credential IDs, rate limits, origin checks and audit logging
   on registration, login and revocation.
8. Provide credential list/remove endpoints with recent authentication and
   no accidental removal of the user's last recovery method.
9. Issue Laravel Sanctum sessions only **after** successful server-side
   verification and apply the existing user status and consent checks.
10. Retain verified email/password + recovery as a supported fallback.

## Frontend requirements

- Register a passkey from an authenticated account via server-provided
  PublicKeyCredentialCreationOptions and submit its attestation.
- Offer passkey sign-in only with a configured server authentication challenge
  and submit the assertion for server verification.
- Handle unsupported browsers, user cancellation and device-level biometric
  availability without leaking sensitive data.
- Test in HTTPS on a supported browser and verify that authentication fails
  for altered challenges, other origins, revoked credentials and other users.

## Release policy

Web passkey controls remain informational until all server and frontend
requirements and integration/security tests pass. No WebAuthn credentials
are stored by this UI update.
