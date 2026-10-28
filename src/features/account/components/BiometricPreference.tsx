import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isNativeBiometry, sessionVault, useBiometricState } from '@/shared/security';
import { Button } from '@/shared/ui';
import { Section } from './Section';

export function BiometricPreference() {
  const { t } = useTranslation('access');
  const state = useBiometricState();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState(false);
  if (!isNativeBiometry()) return null;
  const change = async () => {
    if (pending) return;
    setPending(true);
    setFailure(false);
    try {
      await sessionVault[state.enabled ? 'disable' : 'enable'](t('prompt'));
      await state.refresh();
    } catch {
      setFailure(true);
    } finally {
      setPending(false);
    }
  };
  return (
    <Section title={t('title')}>
      <p>{t('description')}</p>
      <p role="status">
        {t(
          state.enabled ? 'enabled' : state.ready && !state.available ? 'unavailable' : 'disabled',
        )}
      </p>
      {state.ready && state.available && (
        <Button
          variant="secondary"
          loading={pending}
          onClick={() => {
            void change();
          }}
        >
          {t(state.enabled ? 'disable' : 'enable')}
        </Button>
      )}
      {failure && <p role="alert">{t('failure')}</p>}
    </Section>
  );
}
