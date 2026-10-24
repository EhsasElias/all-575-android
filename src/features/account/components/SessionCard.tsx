import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { Button, Icon } from '@/shared/ui';
import { formatDateTime } from '../formatDateTime';
import { useDeviceLabel } from '../useDeviceLabel';
import type { DeviceSession } from '../useSessions';
import styles from './SessionCard.module.css';

type SessionCardProps = {
  session: DeviceSession;
  onRevoke: (session: DeviceSession) => void;
};

export function SessionCard({ session, onRevoke }: SessionCardProps) {
  const { t } = useTranslation('account');
  const { language } = useLanguage();
  const deviceLabel = useDeviceLabel();
  const lastActive = session.last_used_at ? formatDateTime(session.last_used_at, language) : '';
  const signedInOn = session.created_at ? formatDateTime(session.created_at, language) : '';

  return (
    <li className={styles.card}>
      <span className={styles.icon}>
        <Icon name={session.is_current ? 'lock' : 'shield'} />
      </span>
      <div className={styles.body}>
        <p className={styles.name}>
          {deviceLabel(session.device_name)}
          {session.is_current && <span className={styles.badge}>{t('sessions.current')}</span>}
        </p>
        {lastActive && (
          <p className={styles.meta}>{t('sessions.lastActive', { date: lastActive })}</p>
        )}
        {signedInOn && (
          <p className={styles.meta}>{t('sessions.signedInOn', { date: signedInOn })}</p>
        )}
        {!session.is_current && (
          <Button
            variant="secondary"
            className={styles.revoke}
            onClick={() => {
              onRevoke(session);
            }}
          >
            {t('sessions.revoke')}
          </Button>
        )}
      </div>
    </li>
  );
}
