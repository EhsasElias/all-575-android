import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { SessionUser } from '@/shared/session';
import { Button, TextField } from '@/shared/ui';
import { useProfileForm } from '../useProfileForm';
import { LocaleChoice } from './LocaleChoice';
import styles from './ProfileForm.module.css';

type ProfileFormProps = {
  user: SessionUser;
};

export function ProfileForm({ user }: ProfileFormProps) {
  const { t } = useTranslation('account');
  const nameRef = useRef<HTMLInputElement>(null);
  const form = useProfileForm(user, nameRef);

  let nameError = '';
  if (form.errors.name === 'too-long') nameError = t('profile.nameTooLong');
  else if (form.errors.name === 'rejected') nameError = t('profile.nameInvalid');

  let formError = '';
  if (form.errors.form === 'offline') formError = t('profile.offline');
  else if (form.errors.form === 'unknown') formError = t('profile.failed');

  return (
    <form className={styles.form} noValidate onSubmit={form.submit}>
      <TextField
        ref={nameRef}
        name="name"
        autoComplete="name"
        label={t('profile.nameLabel')}
        hint={t('profile.nameHint')}
        error={nameError}
        value={form.name}
        onChange={(event) => {
          form.changeName(event.target.value);
        }}
      />
      <LocaleChoice
        value={form.locale}
        error={form.errors.locale ? t('profile.localeInvalid') : ''}
        onChange={form.changeLocale}
      />
      {formError && (
        <p role="alert" className={styles.alert}>
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth loading={form.saving} disabled={!form.isDirty}>
        {t('profile.save')}
      </Button>
    </form>
  );
}
