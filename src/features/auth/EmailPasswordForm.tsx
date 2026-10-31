import type { SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, TextField } from '@/shared/ui';
import { EmailSignupLegal } from './EmailSignupLegal';
import type { ConsentVersions } from './useConsentVersions';
import styles from './StepLayout.module.css';
import formStyles from './EmailPasswordAccess.module.css';

type Props = {
  createAccount: boolean;
  email: string;
  password: string;
  pending: boolean;
  failure: string;
  notice: string;
  legal: ConsentVersions;
  legalAccepted: boolean;
  marketing: boolean;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onLegal: (accepted: boolean) => void;
  onMarketing: (accepted: boolean) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onOtp: () => void;
};

/** A display-only form: Firebase identity and Laravel session logic live in its parent. */
export function EmailPasswordForm({
  createAccount,
  email,
  password,
  pending,
  failure,
  notice,
  legal,
  legalAccepted,
  marketing,
  onEmail,
  onPassword,
  onLegal,
  onMarketing,
  onSubmit,
  onReset,
  onOtp,
}: Props) {
  const { t } = useTranslation('auth');

  return (
    <div className={styles.step}>
      <form className={styles.form} onSubmit={onSubmit}>
        <TextField
          name="email"
          type="email"
          label={t('emailPassword.email')}
          autoComplete="email"
          autoCapitalize="none"
          dir="ltr"
          required
          value={email}
          onChange={(event) => {
            onEmail(event.target.value);
          }}
        />
        <TextField
          name="password"
          type="password"
          label={t('emailPassword.password')}
          autoComplete={createAccount ? 'new-password' : 'current-password'}
          minLength={createAccount ? 12 : undefined}
          required
          value={password}
          onChange={(event) => {
            onPassword(event.target.value);
          }}
          hint={createAccount ? t('emailPassword.passwordHint') : undefined}
        />
        {createAccount && (
          <EmailSignupLegal
            legal={legal}
            legalAccepted={legalAccepted}
            marketing={marketing}
            onLegal={onLegal}
            onMarketing={onMarketing}
          />
        )}
        {failure && (
          <p role="alert" className={styles.alert}>
            {failure}
          </p>
        )}
        {notice && (
          <p role="status" className={formStyles.notice}>
            {notice}
          </p>
        )}
        <Button type="submit" size="lg" fullWidth loading={pending}>
          {t(createAccount ? 'emailPassword.register' : 'emailPassword.login')}
        </Button>
      </form>
      {!createAccount && (
        <Button variant="ghost" onClick={onReset} disabled={pending}>
          {t('emailPassword.forgot')}
        </Button>
      )}
      <div className={formStyles.alternative}>
        <span>{t('emailPassword.or')}</span>
        <Button variant="secondary" fullWidth onClick={onOtp}>
          {t('emailPassword.useOtp')}
        </Button>
      </div>
    </div>
  );
}
