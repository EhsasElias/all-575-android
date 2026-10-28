import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isNativeBiometry, sessionVault, useBiometricState } from '@/shared/security';
import { useSession } from '@/shared/session';
import { Button } from '@/shared/ui';
import styles from './SignInScreen.module.css';

export function BiometricSignIn() {
  const { t } = useTranslation('access');
  const { restoreSession } = useSession();
  const state = useBiometricState();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState('');
  const unlock = async () => {
    if (pending) return;
    setPending(true);
    setFailure('');
    let verified = false;
    try {
      await sessionVault.unlock(t('prompt'));
      verified = true;
      await restoreSession();
    } catch {
      sessionVault.lock();
      setFailure(t(verified ? 'restoreFailure' : 'failure'));
      await state.refresh();
    } finally {
      setPending(false);
    }
  };
  return (
    <section className={styles.biometry} aria-label={t('title')}>
      <h2>{t('title')}</h2>
      <p className={styles.intro}>
        {t(
          !isNativeBiometry()
            ? 'webOnly'
            : state.ready && !state.available
              ? 'unavailable'
              : 'description',
        )}
      </p>
      {state.enabled && state.available && (
        <Button
          variant="secondary"
          fullWidth
          loading={pending}
          onClick={() => {
            void unlock();
          }}
        >
          {t('unlock')}
        </Button>
      )}
      {failure && <p role="alert">{failure}</p>}
    </section>
  );
}
