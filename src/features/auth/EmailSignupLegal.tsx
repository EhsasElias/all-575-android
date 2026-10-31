import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { ErrorState, Skeleton } from '@/shared/ui';
import { ConsentCheckbox } from './ConsentCheckbox';
import type { ConsentVersions } from './useConsentVersions';
import styles from './EmailPasswordAccess.module.css';

type Props = {
  legal: ConsentVersions;
  legalAccepted: boolean;
  marketing: boolean;
  onLegal: (accepted: boolean) => void;
  onMarketing: (accepted: boolean) => void;
};

export function EmailSignupLegal({
  legal,
  legalAccepted,
  marketing,
  onLegal,
  onMarketing,
}: Props) {
  const { t } = useTranslation('auth');

  return (
    <div className={styles.legal}>
      {legal.status === 'loading' && <Skeleton height="3rem" />}
      {legal.status === 'error' && <ErrorState headingLevel={3} onRetry={legal.retry} />}
      {legal.status === 'ready' && (
        <>
          <ConsentCheckbox
            checked={legalAccepted}
            onChange={onLegal}
            hint={t('emailPassword.legalVersions', {
              terms: legal.versions.terms,
              privacy: legal.versions.privacy,
            })}
          >
            <Trans
              t={t}
              i18nKey="emailPassword.agreeLegal"
              components={{
                termsLink: <Link to={routePaths.terms} />,
                privacyLink: <Link to={routePaths.privacy} />,
              }}
            />
            <span className={styles.required}>{t('emailPassword.required')}</span>
          </ConsentCheckbox>
          <ConsentCheckbox
            checked={marketing}
            onChange={onMarketing}
            hint={t('emailPassword.marketingHint')}
          >
            {t('emailPassword.marketingOptional')}
          </ConsentCheckbox>
        </>
      )}
    </div>
  );
}
