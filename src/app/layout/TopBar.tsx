import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { getNotifications } from '@/features/account/notificationsApi';
import { useSession } from '@/shared/session';
import { IconButton, Logo } from '@/shared/ui';
import { AppMenu } from './AppMenu';
import styles from './TopBar.module.css';

export function TopBar({ onAccountMenu }: { onAccountMenu?: () => void }) {
  const { t } = useTranslation();
  const { t: tNavigation } = useTranslation('navigation');
  const [open, setOpen] = useState(false);
  const { status, user } = useSession();
  const [unread, setUnread] = useState<{ ownerId: string; count: number } | null>(null);
  const ownerId = user?.id === undefined ? null : String(user.id);
  const unreadCount = status === 'signed-in' && unread?.ownerId === ownerId ? unread.count : 0;
  const { i18n } = useTranslation();
  const notificationLabel = i18n.language.startsWith('ar') ? 'الإشعارات' : 'Notifications';

  useEffect(() => {
    if (status !== 'signed-in' || ownerId === null) return;
    let active = true;
    const refresh = () => {
      if (document.visibilityState === 'hidden') return;
      void getNotifications()
        .then((inbox) => {
          if (active) setUnread({ ownerId, count: inbox.unread_count });
        })
        .catch(() => {
          /* Inbox displays fetch errors; keep the previous badge. */
        });
    };
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('all575-notifications-changed', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('all575-notifications-changed', refresh);
    };
  }, [status, ownerId]);
  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <header className={styles.topBar}>
        <IconButton
          label={
            onAccountMenu
              ? i18n.language.startsWith('ar')
                ? 'فتح قائمة الحساب أو لوحة التحكم'
                : 'Open account or dashboard navigation'
              : tNavigation('open')
          }
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            if (onAccountMenu && window.matchMedia('(max-width: 850px)').matches) {
              onAccountMenu();
            } else {
              setOpen(true);
            }
          }}
        >
          <span className={styles.menuIcon} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </IconButton>
        <div className={styles.actions}>
          {status === 'signed-in' && (
            <Link
              to={routePaths.notifications}
              className={styles.notificationButton}
              aria-label={notificationLabel + (unreadCount > 0 ? ` (${unreadCount})` : '')}
              title={notificationLabel}
            >
              <svg
                aria-hidden="true"
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
              {unreadCount > 0 && (
                <span className={styles.notificationCount} aria-hidden="true">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )}
          <Link to={routePaths.home} className={styles.brand} aria-label={t('appName')}>
            <Logo decorative size={48} className={styles.logo} />
          </Link>
        </div>
      </header>
      <AppMenu open={open} onClose={close} />
    </>
  );
}
