import { useRef, useState, type SubmitEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { Button } from '@/shared/ui';
import type { ConsentChoice, LegalVersions } from './authApi';
import type { Channel } from './contact';
import { ConsentCheckbox } from './ConsentCheckbox';
import { FailureAlert } from './FailureAlert';
import type { Progress } from './useSignInFlow';
import styles from './StepLayout.module.css';

type ConsentFormProps = {
  versions: LegalVersions;
  versionsChanged: boolean;
  channel: Channel;
  verify: Progress;
  onAccept: (consent: ConsentChoice) => void;
  /** A provisional signup choice, confirmed by the customer on this screen. */
  initialMarketing?: boolean;
};

type Missing = { terms: boolean; privacy: boolean };

export function ConsentForm({
  versions,
  versionsChanged,
  channel,
  verify,
  onAccept,
  initialMarketing = false,
}: ConsentFormProps) {
  const { t } = useTranslation('auth');
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(initialMarketing);
  const [missing, setMissing] = useState<Missing>({ terms: false, privacy: false });
  const termsRef = useRef<HTMLInputElement>(null);
  const privacyRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (verify.pending) return;
    if (!terms || !privacy) {
      setMissing({ terms: !terms, privacy: !privacy });
      (terms ? privacyRef : termsRef).current?.focus();
      return;
    }
    onAccept({ terms: versions.terms, privacy: versions.privacy, marketing });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {versionsChanged && (
        <p role="status" className={styles.lead}>
          {t('consent.versionsChanged')}
        </p>
      )}
      <ConsentCheckbox
        ref={termsRef}
        checked={terms}
        hint={t('consent.version', { version: versions.terms })}
        error={missing.terms ? t('consent.termsRequired') : undefined}
        onChange={(checked) => {
          setTerms(checked);
          setMissing((current) => ({ ...current, terms: false }));
        }}
      >
        <Trans
          t={t}
          i18nKey="consent.terms"
          components={{ document: <Link to={routePaths.terms} /> }}
        />
      </ConsentCheckbox>
      <ConsentCheckbox
        ref={privacyRef}
        checked={privacy}
        hint={t('consent.version', { version: versions.privacy })}
        error={missing.privacy ? t('consent.privacyRequired') : undefined}
        onChange={(checked) => {
          setPrivacy(checked);
          setMissing((current) => ({ ...current, privacy: false }));
        }}
      >
        <Trans
          t={t}
          i18nKey="consent.privacy"
          components={{ document: <Link to={routePaths.privacy} /> }}
        />
      </ConsentCheckbox>
      <ConsentCheckbox
        checked={marketing}
        hint={t('consent.marketingHint')}
        onChange={setMarketing}
      >
        {t('consent.marketing')}
      </ConsentCheckbox>
      {verify.failure && <FailureAlert failure={verify.failure} channel={channel} />}
      <Button type="submit" size="lg" fullWidth loading={verify.pending}>
        {t('consent.accept')}
      </Button>
    </form>
  );
}
