import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { Button } from '@/shared/ui';
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

/**
 * Always show the consent choices. The required checkbox stays disabled until
 * the API supplies the exact legal versions, so no outdated terms are accepted.
 */
export function EmailSignupLegal({ legal, legalAccepted, marketing, onLegal, onMarketing }: Props) {
  const { t } = useTranslation('auth');

  return (
    <div className={styles.legal}>
      <ConsentCheckbox
        checked={legalAccepted}
        disabled={legal.status !== 'ready'}
        onChange={onLegal}
        hint={
          legal.status === 'ready'
            ? t('emailPassword.legalVersions', {
                terms: legal.versions.terms,
                privacy: legal.versions.privacy,
              })
            : t('emailPassword.legalNotReady')
        }
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
      {legal.status === 'loading' && (
        <p role="status" className={styles.legalStatus}>
          {t('emailPassword.legalLoading')}
        </p>
      )}
      {legal.status === 'error' && (
        <div className={styles.legalStatus}>
          <p role="alert">{t('emailPassword.legalUnavailable')}</p>
          <Button variant="ghost" onClick={legal.retry}>
            {t('emailPassword.legalRetry')}
          </Button>
        </div>
      )}
    </div>
  );
}
