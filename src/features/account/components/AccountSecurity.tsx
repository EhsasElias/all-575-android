import { useTranslation } from 'react-i18next';
import { isNativeBiometry } from '@/shared/security';
import { BiometricPreference } from './BiometricPreference';
import { Section } from './Section';

/**
 * Account security is always visible. Native biometric unlock is managed by
 * BiometricPreference; web passkey enrolment must not be offered until the API
 * supports challenge, origin and signature verification.
 */
export function AccountSecurity() {
  const { t } = useTranslation('account');
  const native = isNativeBiometry();

  return (
    <Section title={t('security.title')}>
      {native ? (
        <>
          <p>{t('security.nativeInfo')}</p>
          <BiometricPreference />
        </>
      ) : (
        <>
          <p>{t('security.webInfo')}</p>
          <p role="status">{t('security.webUnavailable')}</p>
        </>
      )}
      <p>{t('security.privacy')}</p>
    </Section>
  );
}
