# Web fingerprint / passkeys (feature/web-passkeys)

Browser fingerprint and face sign-in uses WebAuthn passkeys; biometrics
never leave the user's device. Native Android session unlocking is separate.

The feature branch includes the browser WebAuthn client, Account -> Security
& sign-in enrollment/removal UI, and a passkey login button. The button
appears only when /api/v1/auth/passkeys/status reports enabled=true.

The Laravel API code is on the matching backend feature branch, using the
maintained laravel/passkeys package for WebAuthn attestation/assertion checks.

Do not deploy the web frontend before the matching API. The backend package
must be resolved into composer.lock, the migrations run, and the challenge,
origin, RP ID, signature and account security tests must pass.

Test on the canonical HTTPS origin https://market575.com with an account
that has verified email, current Terms and Privacy acceptance, and a known
password. Enter the password in Account -> Security, name the passkey and
register. Then sign out and sign in with the passkey. Finally revoke it using
password confirmation and ensure it no longer logs in.

If disabled by the API, the account page shows an unavailable explanation
rather than a nonworking control. WebAuthn may use a PIN/device credential
rather than fingerprint depending on platform settings.

The original native biometric implementation is unchanged.
