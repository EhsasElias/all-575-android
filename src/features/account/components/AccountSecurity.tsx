import { isNativeBiometry } from '@/shared/security';
import { BiometricPreference } from './BiometricPreference';
import { WebPasskeySettings } from './WebPasskeySettings';

/** Native biometric unlock and web passkeys use separate trusted platform APIs. */
export function AccountSecurity() {
  return isNativeBiometry() ? <BiometricPreference /> : <WebPasskeySettings />;
}
