import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ErrorState, Skeleton } from '@/shared/ui';
import type { ConsentChoice, LegalVersions } from './authApi';
import type { Channel } from './contact';
import { ConsentForm } from './ConsentForm';
import { useConsentVersions } from './useConsentVersions';
import type { Progress } from './useSignInFlow';
import styles from './StepLayout.module.css';

type ConsentStepProps = {
  channel: Channel;
  /** The versions the server asked for; when it did not say, the current ones are loaded. */
  versions: LegalVersions | null;
  versionsChanged: boolean;
  verify: Progress;
  onAccept: (consent: ConsentChoice) => void;
  onBack: () => void;
};

/** Terms and Privacy are required and start unticked; marketing is a separate, optional choice. */
export function ConsentStep({
  channel,
  versions,
  versionsChanged,
  verify,
  onAccept,
  onBack,
}: ConsentStepProps) {
  const { t } = useTranslation('auth');
  const resolved = useConsentVersions(versions);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className={styles.step}>
      <h2 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
        {t('consent.title')}
      </h2>
      <p className={styles.lead}>{t('consent.lead')}</p>
      {resolved.status === 'loading' && (
        <div role="status" aria-busy="true" aria-label={t('consent.loadingVersions')}>
          <Skeleton height="6rem" />
        </div>
      )}
      {resolved.status === 'error' && <ErrorState onRetry={resolved.retry} headingLevel={3} />}
      {resolved.status === 'ready' && (
        <ConsentForm
          // New versions mean new text to read: the boxes start unticked again.
          key={`${resolved.versions.terms}|${resolved.versions.privacy}`}
          versions={resolved.versions}
          versionsChanged={versionsChanged}
          channel={channel}
          verify={verify}
          onAccept={onAccept}
        />
      )}
      <Button variant="ghost" onClick={onBack}>
        {t('consent.back')}
      </Button>
    </div>
  );
}
