import { Capacitor } from '@capacitor/core';

/** Never use the plugin's simulated web implementation for authentication. */
export const isNativeBiometry = () => Capacitor.isNativePlatform();

export async function hasStrongBiometry(): Promise<boolean> {
  if (!isNativeBiometry()) return false;
  const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
  return (await BiometricAuth.checkBiometry()).strongBiometryIsAvailable;
}

export async function authenticateBiometry(reason: string): Promise<void> {
  if (!(await hasStrongBiometry())) throw new Error('Biometry unavailable');
  const { BiometricAuth, AndroidBiometryStrength } =
    await import('@aparajita/capacitor-biometric-auth');
  await BiometricAuth.authenticate({
    reason,
    androidTitle: reason,
    allowDeviceCredential: false,
    androidBiometryStrength: AndroidBiometryStrength.strong,
    iosFallbackTitle: '',
  });
}
