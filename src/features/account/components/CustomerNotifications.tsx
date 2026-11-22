import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationInbox,
} from '../notificationsApi';
import styles from './CustomerNotifications.module.css';

const labels = {
  ar: {
    title: 'الإشعارات',
    refresh: 'تحديث',
    all: 'تحديد الكل كمقروء',
    read: 'تحديد كمقروء',
    empty: 'لا توجد إشعارات حاليًا',
    failure: 'تعذر تحميل الإشعارات. حاولي التحديث.',
    loading: 'جارٍ تحميل الإشعارات',
    unread: 'غير مقروء',
    open: 'عرض التفاصيل',
    allFilter: 'الكل',
    unreadFilter: 'غير المقروءة',
    readStatus: 'تمت القراءة',
    newStatus: 'جديد',
    noUnread: 'تمت قراءة جميع الإشعارات',
  },
  en: {
    title: 'Notifications',
    refresh: 'Refresh',
    all: 'Mark all as read',
    read: 'Mark as read',
    empty: 'No notifications yet',
    failure: 'Could not load notifications. Try refreshing.',
    loading: 'Loading notifications',
    unread: 'Unread',
    open: 'View details',
    allFilter: 'All',
    unreadFilter: 'Unread',
    readStatus: 'Read',
    newStatus: 'New',
    noUnread: 'You are all caught up',
  },
  fr: {
    title: 'Notifications',
    refresh: 'Actualiser',
    all: 'Tout marquer comme lu',
    read: 'Marquer comme lu',
    empty: 'Aucune notification pour le moment',
    failure: 'Impossible de charger les notifications. Réessayez.',
    loading: 'Chargement des notifications',
    unread: 'Non lu',
    open: 'Voir les détails',
    allFilter: 'Tout',
    unreadFilter: 'Non lues',
    readStatus: 'Lu',
    newStatus: 'Nouveau',
    noUnread: 'Tous les avis sont lus',
  },
} as const;

export function CustomerNotifications() {
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('ar')
    ? 'ar'
    : i18n.language.startsWith('fr')
      ? 'fr'
      : 'en';
  const t = labels[language];
  const [inbox, setInbox] = useState<NotificationInbox | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const visibleNotices = inbox?.data.filter((notice) => filter === 'all' || !notice.read_at) ?? [];

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
    // Schedule the initial fetch outside the synchronous effect body.
    const initialFetch = window.setTimeout(() => { void load(); }, 0);
    const refresh = () => {
      if (document.visibilityState === 'visible') void load();
    };
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  // Re-fetch localized API messages whenever the interface language changes.
  }, [load, language]);

  const markRead = async (id: number) => {
    if (busy) return;
    setBusy(true);
    try {
      await markNotificationRead(id);
      await load();
      window.dispatchEvent(new Event('all575-notifications-changed'));
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
      window.dispatchEvent(new Event('all575-notifications-changed'));
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
          <div>
            <h2>{t.title}</h2>
            <p className={styles.subtitle}>{t.unread}: {inbox?.unread_count ?? 0}</p>
          </div>
          {(inbox?.unread_count ?? 0) > 0 && (
            <span className={styles.count} aria-label={t.unread}>
              {inbox?.unread_count}
            </span>
          )}
        </div>
        <div className={styles.headingActions}>
          <button type="button" className={styles.refresh} onClick={() => void load()} disabled={busy}>
            {t.refresh}
          </button>
          {inbox && inbox.unread_count > 0 && (
            <button type="button" className={styles.markAll} disabled={busy} onClick={() => void markAll()}>
              {t.all}
            </button>
          )}
        </div>
      </header>
      {error && <p role="alert" className={styles.error}>{t.failure}</p>}
      {inbox === null && !error && <p role="status" className={styles.empty}>{t.loading}</p>}
      {inbox && inbox.data.length > 0 && (
        <div className={styles.filterBar} role="group" aria-label={t.title}>
          <button
            type="button"
            className={styles.filterButton}
            aria-pressed={filter === 'all'}
            onClick={() => { setFilter('all'); }}
          >
            {t.allFilter} <span>{inbox.data.length}</span>
          </button>
          <button
            type="button"
            className={styles.filterButton}
            aria-pressed={filter === 'unread'}
            onClick={() => { setFilter('unread'); }}
          >
            {t.unreadFilter} <span>{inbox.unread_count}</span>
          </button>
        </div>
      )}
      {inbox && visibleNotices.length === 0 && (
        <p className={styles.empty}>{filter === 'unread' ? t.noUnread : t.empty}</p>
      )}
      {visibleNotices.length > 0 && (
        <ul className={styles.list}>
          {visibleNotices.map((notice) => (
            <li key={notice.id}>
              <article className={styles.notice} data-unread={!notice.read_at}>
                <div className={styles.noticeBody}>
                  <span className={styles.noticeIcon} aria-hidden="true">
                    {notice.read_at ? '✓' : '✉'}
                  </span>
                  <div className={styles.noticeContent}>
                    <div className={styles.noticeTitle}>
                      <strong dir="auto">{notice.title}</strong>
                      <span className={styles.status} data-unread={!notice.read_at}>
                        {notice.read_at ? t.readStatus : t.newStatus}
                      </span>
                    </div>
                    <p className={styles.message} dir="auto">{notice.message}</p>
                    <time className={styles.date} dateTime={notice.created_at}>
                      {new Date(notice.created_at).toLocaleString(
                        language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-GB',
                      )}
                    </time>
                  </div>
                </div>
                <div className={styles.noticeActions}>
                  {notice.target_path?.startsWith('/') && !notice.target_path.startsWith('//') && (
                    <Link to={notice.target_path} className={styles.markRead}>
                      {t.open}
                    </Link>
                  )}
                  {!notice.read_at && (
                    <button
                      type="button"
                      className={styles.markRead}
                      disabled={busy}
                      onClick={() => void markRead(notice.id)}
                    >
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
