import { useCallback, useEffect, useState } from 'react';
import { getNotifications, markAllNotificationsRead, markNotificationRead, type NotificationInbox } from '../notificationsApi';

export function CustomerNotifications() {
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
    <section aria-label="إشعارات العميل" style={{ marginBlock: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0 }}>الإشعارات {inbox?.unread_count ? '(' + inbox.unread_count + ')' : ''}</h2>
        <button type="button" onClick={() => void load()}>تحديث</button>
      </div>
      {error && <p role="alert">تعذر تحميل الإشعارات. حاول التحديث.</p>}
      {inbox && inbox.unread_count > 0 && (
        <button type="button" disabled={busy} onClick={() => void markAll()}>
          تحديد الكل كمقروء
        </button>
      )}
      {inbox?.data.length === 0 && <p>لا توجد إشعارات حاليًا.</p>}
      {inbox?.data.map((notice) => (
        <article key={notice.id} style={{ paddingBlock: 12, borderBottom: '1px solid var(--color-border)' }}>
          <strong>{notice.title}</strong>
          <p>{notice.message}</p>
          <small>{new Date(notice.created_at).toLocaleString()}</small>
          {!notice.read_at && (
            <button type="button" disabled={busy} onClick={() => void markRead(notice.id)}>
              تحديد كمقروء
            </button>
          )}
        </article>
      ))}
    </section>
  );
}
