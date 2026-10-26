import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { TraceEntry } from '@/shared/api';
import { useRequestLog } from './useRequestLog';
import styles from './RequestLog.module.css';

function seconds(entry: TraceEntry, now: number): number {
  return Math.max(0, Math.round((now - entry.startedAt) / 1_000));
}

function outcome(entry: TraceEntry, now: number, t: TFunction<'testserver'>): string {
  const ms = (entry.endedAt ?? now) - entry.startedAt;
  const note = entry.stage === 'sending' && entry.detail !== '' ? ` (${entry.detail})` : '';
  switch (entry.stage) {
    case 'preparing':
      return t('log.preparing', { seconds: seconds(entry, now) });
    case 'sending':
      return t('log.sending', { seconds: seconds(entry, now) }) + note;
    case 'done':
      return t('log.done', { status: entry.detail, ms });
    case 'failed':
      return t('log.failed', { reason: entry.detail, ms });
  }
}

/** The last requests this test build made and how each one stands, to find out why a screen does not load. */
export function RequestLog() {
  const { t } = useTranslation('testserver');
  const log = useRequestLog();

  return (
    <section className={styles.log} aria-labelledby="request-log-title">
      <h2 id="request-log-title" className={styles.title}>
        {t('log.title')}
      </h2>
      <p className={styles.lead}>{t('log.lead')}</p>
      <p className={styles.state}>
        {t('log.state', {
          browser: log.browserOnline ? t('log.online') : t('log.offline'),
          queries: log.queriesOnline ? t('log.online') : t('log.offline'),
          session: log.session,
        })}
      </p>
      {log.entries.length === 0 ? (
        <p className={styles.empty}>{t('log.empty')}</p>
      ) : (
        <ul className={styles.list}>
          {log.entries.map((entry) => (
            <li key={entry.id} className={styles.row} data-stage={entry.stage}>
              <bdi dir="ltr" className={styles.request}>
                {entry.method} {entry.path}
              </bdi>
              <span>{outcome(entry, log.now, t)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
