import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/shared/session';
import { Button } from '@/shared/ui';
import { currentDeviceName } from './deviceName';
import { loginWithWebPasskey, webPasskeysSupported, webPasskeysEnabled } from './webPasskeys';

export function WebPasskeySignIn() {
  const { t } = useTranslation('account');
  const { signIn } = useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const supported = webPasskeysSupported();
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (!supported) return;
    let mounted = true;
    void webPasskeysEnabled().then((value) => {
      if (mounted) setEnabled(value);
    });
    return () => { mounted = false; };
  }, [supported]);

  if (!supported || !enabled) return null;

  const signInWithPasskey = async () => {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      const result = await loginWithWebPasskey(currentDeviceName());
      await signIn(result.token, result.user);
    } catch {
      setError(t('security.signInFailed'));
    } finally {
      setPending(false);
    }
  };

  return (
    <section aria-label={t('security.title')}>
      <Button variant="secondary" fullWidth loading={pending} onClick={() => void signInWithPasskey()}>
        {t('security.signIn')}
      </Button>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
