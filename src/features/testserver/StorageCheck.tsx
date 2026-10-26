import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import {
  STORAGE_CHECK_GIVE_UP_MS,
  useStorageCheck,
  type StorageCheck as Result,
} from './useStorageCheck';
import styles from './StorageCheck.module.css';

function describeResult(
  result: Result,
  t: ReturnType<typeof useTranslation<'testserver'>>['t'],
): string {
  switch (result.state) {
    case 'idle':
    case 'checking':
      return '';
    case 'answered':
      return t('storage.answered', {
        ms: result.ms,
        token: result.hasToken ? t('storage.hasToken') : t('storage.noToken'),
      });
    case 'failed':
      return t('storage.failed', { ms: result.ms, reason: result.reason });
    case 'silent':
      return t('storage.silent', { seconds: STORAGE_CHECK_GIVE_UP_MS / 1_000 });
  }
}

/** Test build: asks the phone's secure storage for the sign-in, because every request waits for its answer. */
export function StorageCheck() {
  const { t } = useTranslation('testserver');
  const { result, run } = useStorageCheck();
  const checking = result.state === 'checking';

  return (
    <section className={styles.section} aria-labelledby="storage-check-title">
      <h2 id="storage-check-title" className={styles.title}>
        {t('storage.title')}
      </h2>
      <p className={styles.lead}>{t('storage.lead')}</p>
      <Button variant="secondary" loading={checking} onClick={() => void run()}>
        {checking ? t('storage.checking') : t('storage.check')}
      </Button>
      <p role="status" className={styles.result} data-state={result.state}>
        {describeResult(result, t)}
      </p>
    </section>
  );
}
