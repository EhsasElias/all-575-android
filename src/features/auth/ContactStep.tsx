import { useEffect, useRef, useState, type ChangeEvent, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, TextField } from '@/shared/ui';
import type { AuthFailure } from './authFailure';
import { checkContact, type Channel, type Contact, type ContactProblem } from './contact';
import { FailureAlert } from './FailureAlert';
import styles from './StepLayout.module.css';

type ContactStepProps = {
  /** What was typed before, when the customer came back to change it. */
  initial: Contact;
  pending: boolean;
  failure: AuthFailure | null;
  onSubmit: (contact: Contact) => void;
  /** The customer is changing the field, so an old server answer no longer applies. */
  onEdit: () => void;
};

const FIELD_PROPS = {
  phone: {
    type: 'tel',
    inputMode: 'tel',
    autoComplete: 'tel',
    name: 'phone',
  },
  email: {
    type: 'email',
    inputMode: 'email',
    autoComplete: 'email',
    name: 'email',
  },
} as const;

function isDestinationFailure(failure: AuthFailure | null): boolean {
  return failure?.kind === 'field' && failure.field === 'destination';
}

export function ContactStep({ initial, pending, failure, onSubmit, onEdit }: ContactStepProps) {
  const { t } = useTranslation('auth');
  const [channel, setChannel] = useState<Channel>(initial.channel);
  const [value, setValue] = useState(initial.destination);
  const [problem, setProblem] = useState<ContactProblem | null>(null);
  const [cameBack] = useState(initial.destination !== '');
  const inputRef = useRef<HTMLInputElement>(null);
  const isPhone = channel === 'phone';

  useEffect(() => {
    if (cameBack) inputRef.current?.focus();
  }, [cameBack]);

  useEffect(() => {
    if (isDestinationFailure(failure)) inputRef.current?.focus();
  }, [failure]);

  const invalidKey = isPhone ? 'contact.phoneInvalid' : 'contact.emailInvalid';
  const requiredKey = isPhone ? 'contact.phoneRequired' : 'contact.emailRequired';
  let fieldError = '';
  if (problem === 'required') fieldError = t(requiredKey);
  else if (problem === 'invalid' || isDestinationFailure(failure)) fieldError = t(invalidKey);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    setProblem(null);
    onEdit();
  };

  const handleSwitchChannel = () => {
    setChannel(isPhone ? 'email' : 'phone');
    setValue('');
    setProblem(null);
    onEdit();
    inputRef.current?.focus();
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const check = checkContact(channel, value);
    if (!check.ok) {
      setProblem(check.problem);
      inputRef.current?.focus();
      return;
    }
    setProblem(null);
    onSubmit({ channel, destination: check.destination });
  };

  const alertFailure = failure !== null && !isDestinationFailure(failure) ? failure : null;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.stepTitle}>
        {t(isPhone ? 'contact.phoneTitle' : 'contact.emailTitle')}
      </h2>
      <TextField
        {...FIELD_PROPS[channel]}
        ref={inputRef}
        dir="ltr"
        autoCapitalize="none"
        spellCheck={false}
        label={t(isPhone ? 'contact.phoneLabel' : 'contact.emailLabel')}
        hint={t(isPhone ? 'contact.phoneHint' : 'contact.emailHint')}
        error={fieldError}
        value={value}
        onChange={handleChange}
      />
      {alertFailure && <FailureAlert failure={alertFailure} channel={channel} />}
      <div className={styles.actions}>
        <Button type="submit" size="lg" fullWidth loading={pending}>
          {t('contact.send')}
        </Button>
        <Button variant="ghost" onClick={handleSwitchChannel}>
          {t(isPhone ? 'contact.useEmail' : 'contact.usePhone')}
        </Button>
      </div>
    </form>
  );
}
