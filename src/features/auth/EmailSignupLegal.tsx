import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { ErrorState, Skeleton } from '@/shared/ui';
import type { ConsentVersions } from './useConsentVersions';
import styles from './EmailPasswordAccess.module.css';

type Props = {
  legal: ConsentVersions;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  onTerms: (accepted: boolean) => void;
  onPrivacy: (accepted: boolean) => void;
};

export function EmailSignupLegal({
  legal,
  termsAccepted,
  privacyAccepted,
  onTerms,
  onPrivacy,
}: Props) {
  const { t } = useTranslation('auth');

  return (
    <div className={styles.legal}>
      {legal.status === 'loading' && <Skeleton height="3rem" />}
      {legal.status === 'error' && <ErrorState headingLevel={3} onRetry={legal.retry} />}
      {legal.status === 'ready' && (
        <>
          <label>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => {
                onTerms(event.target.checked);
              }}
            />
            {t('emailPassword.agreeTerms')}{' '}
            <Link to={routePaths.terms}>{t('emailPassword.terms')}</Link> (
            {legal.versions.terms})
          </label>
          <label>
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(event) => {
                onPrivacy(event.target.checked);
              }}
            />
            {t('emailPassword.agreePrivacy')}{' '}
            <Link to={routePaths.privacy}>{t('emailPassword.privacy')}</Link> (
            {legal.versions.privacy})
          </label>
        </>
      )}
    </div>
  );
}
