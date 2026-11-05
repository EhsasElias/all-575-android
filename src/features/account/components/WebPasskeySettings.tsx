import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { listWebPasskeys, registerWebPasskey, revokeWebPasskey, webPasskeysSupported, type WebPasskey } from '@/features/auth/webPasskeys';
import { Section } from './Section';

/** Password confirmation is required for registration and revocation. */
export function WebPasskeySettings() {
  const { t } = useTranslation('account');
  const [supported] = useState(webPasskeysSupported);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [items, setItems] = useState<WebPasskey[]>([]);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const refresh = async () => {
    try {
      const next = await listWebPasskeys();
      setItems(next);
      setAvailable(true);
    } catch {
      setAvailable(false);
    }
  };

  useEffect(() => {
    if (supported) void refresh();
  }, [supported]);

  const register = async () => {
    if (pending || !password || !name.trim()) return;
    setPending(true); setMessage(''); setError('');
    try {
      await registerWebPasskey(password, name.trim());
      setPassword(''); setName('');
      await refresh();
      setMessage(t('security.registered'));
    } catch {
      setError(t('security.failed'));
    } finally {
      setPending(false);
    }
  };

  const revoke = async (id: number) => {
    if (pending || !password) {
      setError(t('security.passwordRequired'));
      return;
    }
    setPending(true); setMessage(''); setError('');
    try {
      await revokeWebPasskey(id, password);
      setPassword('');
      await refresh();
      setMessage(t('security.revoked'));
    } catch {
      setError(t('security.failed'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Section title={t('security.title')}>
      <p>{t('security.webInfo')}</p>
      {!supported && <p role="status">{t('security.unsupported')}</p>}
      {supported && available !== true && <p role="status">{t('security.webUnavailable')}</p>}
      {supported && available === true && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            {t('security.password')}
            <input type="password" autoComplete="current-password" value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={{ inlineSize: '100%', minBlockSize: '2.75rem' }} />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            {t('security.deviceName')}
            <input type="text" maxLength={100} value={name}
              onChange={(event) => setName(event.target.value)}
              style={{ inlineSize: '100%', minBlockSize: '2.75rem' }} />
          </label>
          <Button variant="secondary" onClick={() => void register()} disabled={!password || !name.trim() || pending}
            loading={pending}>{t('security.register')}</Button>
          {items.length > 0 && <h3>{t('security.registeredDevices')}</h3>}
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
              <span>{item.name}</span>
              <Button variant="ghost" onClick={() => void revoke(item.id)} disabled={pending || !password}>
                {t('security.remove')}
              </Button>
            </div>
          ))}
          {message && <p role="status">{message}</p>}
          {error && <p role="alert">{error}</p>}
        </div>
      )}
      <p>{t('security.privacy')}</p>
    </Section>
  );
}
