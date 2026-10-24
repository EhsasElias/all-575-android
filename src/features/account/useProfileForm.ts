import { useMutation } from '@tanstack/react-query';
import { useState, type RefObject, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { http, isApiError, type Data, type Schemas } from '@/shared/api';
import { isLanguage, type Language } from '@/shared/i18n';
import { useSession, type SessionUser } from '@/shared/session';
import { useToast } from '@/shared/ui';

export const NAME_MAX_LENGTH = 100;

type ProfileUpdate = Schemas['UpdateMeRequest'];

export type ProfileErrors = {
  name: 'too-long' | 'rejected' | null;
  locale: boolean;
  /** A problem with the whole form rather than one field. */
  form: 'offline' | 'unknown' | null;
};

const NO_ERRORS: ProfileErrors = { name: null, locale: false, form: null };

function readServerErrors(error: unknown): ProfileErrors {
  if (error === null) return NO_ERRORS;
  if (!isApiError(error)) return { ...NO_ERRORS, form: 'unknown' };
  const name = 'name' in error.fieldErrors;
  const locale = 'locale' in error.fieldErrors;
  if (name || locale) return { name: name ? 'rejected' : null, locale, form: null };
  const offline = error.kind === 'network' || error.kind === 'timeout';
  return { ...NO_ERRORS, form: offline ? 'offline' : 'unknown' };
}

function localeOf(user: SessionUser): Language {
  return isLanguage(user.locale) ? user.locale : 'ar';
}

/**
 * The editable parts of the profile (what `PATCH /me` accepts: the name and the preferred language).
 * `nameRef` is the name field, which takes the focus when the name is not valid.
 */
export function useProfileForm(user: SessionUser, nameRef: RefObject<HTMLInputElement | null>) {
  const { t } = useTranslation('account');
  const { setUser } = useSession();
  const { showToast } = useToast();
  const [name, setName] = useState(user.name ?? '');
  const [locale, setLocale] = useState<Language>(localeOf(user));
  const [tooLong, setTooLong] = useState(false);

  const mutation = useMutation({
    mutationFn: async (update: ProfileUpdate) =>
      (await http.patch<Data<SessionUser>>('/me', update)).data,
    onSuccess: (updated) => {
      setUser(updated);
      setName(updated.name ?? '');
      showToast({ message: t('profile.saved'), variant: 'success' });
    },
  });

  const serverErrors = readServerErrors(mutation.error);
  const errors: ProfileErrors = tooLong ? { ...serverErrors, name: 'too-long' } : serverErrors;
  const trimmedName = name.trim();
  const isDirty = trimmedName !== (user.name ?? '') || locale !== localeOf(user);

  return {
    name,
    locale,
    errors,
    isDirty,
    saving: mutation.isPending,
    changeName: (value: string) => {
      setName(value);
      setTooLong(false);
    },
    changeLocale: setLocale,
    submit: (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (mutation.isPending) return;
      if (trimmedName.length > NAME_MAX_LENGTH) {
        setTooLong(true);
        nameRef.current?.focus();
        return;
      }
      mutation.mutate({ name: trimmedName === '' ? null : trimmedName, locale });
    },
  };
}
