import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getNotifications, markAllNotificationsRead, markNotificationRead, type NotificationInbox } from '../notificationsApi';
import styles from './CustomerNotifications.module.css';

const labels = {
  ar: { title: 'الإشعارات', refresh: 'تحديث', all: 'تحديد الكل كمقروء', read: 'تحديد كمقروء', empty: 'لا توجد إشعارات حاليًا', failure: 'تعذر تحميل الإشعارات. حاولي التحديث.', loading: 'جارٍ تحميل الإشعارات', unread: 'غير مقروء' },
  en: { title: 'Notifications', refresh: 'Refresh', all: 'Mark all as read', read: 'Mark as read', empty: 'No notifications yet', failure: 'Could not load notifications. Try refreshing.', loading: 'Loading notifications', unread: 'Unread' },
  fr: { title: 'Notifications', refresh: 'Actualiser', all: 'Tout marquer comme lu', read: 'Marquer comme lu', empty: 'Aucune notification pour le moment', failure: 'Impossible de charger les notifications. Réessayez.', loading: 'Chargement des notifications', unread: 'Non lu' },
} as const;

export function CustomerNotifications() {
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('ar') ? 'ar' : i18n.language.startsWith('fr') ? 'fr' : 'en';
  const t = labels[language];
  const [inbox, setInbox] = useState<NotificationInbox | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await getNotifications();
      setInbox(result);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (id: number) => {
    if (busy) return;
    setBusy(true);
    try {
      await markNotificationRead(id);
      await load();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const markAll = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await markAllNotificationsRead();
      await load();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.section} aria-label={t.title}>
      <header className={styles.heading}>
        <div className={styles.titleLine}>
          <h2>{t.title}</h2>
          {(inbox?.unread_count ?? 0) > 0 && (
            <span className={styles.count} aria-label={t.unread}>{inbox?.unread_count}</span>
          )}
        </div>
        <button type="button" className={styles.refresh} onClick={() => void load()} disabled={busy}>
          {t.refresh}
        </button>
      </header>
      {error && <p role="alert" className={styles.error}>{t.failure}</p>}
      {inbox === null && !error && <p role="status" className={styles.empty}>{t.loading}</p>}
      {inbox && inbox.unread_count > 0 && (
        <div className={styles.toolbar}>
          <button type="button" className={styles.markAll} disabled={busy} onClick={() => void markAll()}>
            {t.all}
          </button>
        </div>
      )}
      {inbox?.data.length === 0 && <p className={styles.empty}>{t.empty}</p>}
      {inbox && inbox.data.length > 0 && (
        <ul className={styles.list}>
          {inbox.data.map((notice) => (
            <li key={notice.id}>
              <article className={styles.notice} data-unread={!notice.read_at}>
                <div className={styles.noticeTitle}>
                  <strong>{notice.title}</strong>
                  {!notice.read_at && <span className={styles.unreadDot} aria-label={t.unread} />}
                </div>
                <p className={styles.message}>{notice.message}</p>
                <div className={styles.meta}>
                  <time dateTime={notice.created_at}>
                    {new Date(notice.created_at).toLocaleString(
                      language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-GB',
                    )}
                  </time>
                  {!notice.read_at && (
                    <button type="button" className={styles.markRead} disabled={busy}
                      onClick={() => void markRead(notice.id)}>
                      {t.read}
                    </button>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
