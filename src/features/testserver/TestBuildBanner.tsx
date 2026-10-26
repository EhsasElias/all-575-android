import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { env, routePaths, isTestServerEnabled } from '@/shared/lib';
import styles from './TestBuildBanner.module.css';

function hostOf(address: string): string {
  try {
    return new URL(address).host;
  } catch {
    return address;
  }
}

/** A strip on every screen of a test build: which server the app talks to, and the way to change it. */
export function TestBuildBanner() {
  const { t } = useTranslation('testserver');
  if (!isTestServerEnabled()) return null;

  return (
    <div className={styles.banner}>
      <p className={styles.text}>
        <strong>{t('banner.label')}</strong>
        {' · '}
        {env.apiBaseUrl === '' ? (
          t('banner.noServer')
        ) : (
          <>
            {t('banner.server')} <bdi dir="ltr">{hostOf(env.apiBaseUrl)}</bdi>
          </>
        )}
      </p>
      <Link to={routePaths.testServer} className={styles.link}>
        {t('banner.change')}
      </Link>
    </div>
  );
}
