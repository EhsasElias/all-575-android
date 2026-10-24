import { useEffect, useRef, useState, type ChangeEvent, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, TextField } from '@/shared/ui';
import type { AuthFailure } from './authFailure';
import type { Contact } from './contact';
import { FailureAlert } from './FailureAlert';
import { isCompleteCode, sanitizeCode } from './otpCode';
import { ResendControl } from './ResendControl';
import type { Challenge } from './signInFlow';
import type { Progress } from './useSignInFlow';
import { useFailureText } from './useFailureText';
import codeStyles from './CodeStep.module.css';
import styles from './StepLayout.module.css';

type CodeStepProps = {
  contact: Contact;
  challenge: Challenge;
  verify: Progress;
  resend: Progress;
  onVerify: (code: string) => void;
  onResend: () => void;
  onChangeContact: () => void;
};

/** The code field is wrong when the server says so about the code itself. */
function codeFieldFailure(failure: AuthFailure | null): AuthFailure | null {
  if (failure?.kind === 'otp-invalid') return failure;
  return failure?.kind === 'field' && failure.field === 'code' ? failure : null;
}

/** An expired or locked code can never work again: the customer needs a new one. */
function isDeadCode(failure: AuthFailure | null): boolean {
  return failure?.kind === 'otp-expired' || failure?.kind === 'otp-locked';
}

export function CodeStep({
  contact,
  challenge,
  verify,
  resend,
  onVerify,
  onResend,
  onChangeContact,
}: CodeStepProps) {
  const { t } = useTranslation('auth');
  const failureText = useFailureText();
  const [code, setCode] = useState('');
  const [incomplete, setIncomplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isPhone = contact.channel === 'phone';

  // On arrival and after every wrong code the field is ready for the next try, with the old digits selected.
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [verify.failure]);

  const fieldFailure = codeFieldFailure(verify.failure);
  const dead = isDeadCode(verify.failure);
  let fieldError = '';
  if (incomplete) fieldError = t('code.incomplete');
  else if (fieldFailure) fieldError = failureText(fieldFailure, contact.channel);
  const alertFailure = fieldFailure === null ? (verify.failure ?? resend.failure) : resend.failure;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCode(sanitizeCode(event.target.value));
    setIncomplete(false);
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (verify.pending || dead) return;
    if (!isCompleteCode(code)) {
      setIncomplete(true);
      inputRef.current?.focus();
      return;
    }
    onVerify(code);
  };

  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>{t('code.title')}</h2>
      <div className={codeStyles.sentTo}>
        <p className={styles.lead}>{t('code.sentTo')}</p>
        <p className={codeStyles.destination}>
          <bdi dir="ltr">{contact.destination}</bdi>
        </p>
        <Button variant="ghost" onClick={onChangeContact}>
          {t(isPhone ? 'code.changePhone' : 'code.changeEmail')}
        </Button>
      </div>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          ref={inputRef}
          className={codeStyles.codeField}
          dir="ltr"
          name="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          label={t('code.label')}
          hint={t('code.hint')}
          error={fieldError}
          value={code}
          onChange={handleChange}
        />
        {alertFailure && <FailureAlert failure={alertFailure} channel={contact.channel} />}
        <Button type="submit" size="lg" fullWidth loading={verify.pending} disabled={dead}>
          {t('code.verify')}
        </Button>
      </form>
      <ResendControl resendAt={challenge.resendAt} pending={resend.pending} onResend={onResend} />
    </div>
  );
}
