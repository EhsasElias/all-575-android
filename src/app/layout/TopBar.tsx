import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { Logo } from '@/shared/ui';
import styles from './TopBar.module.css';

export function TopBar() {
  const { t } = useTranslation();

  return (
    <header className={styles.topBar}>
      <Link to={routePaths.home} className={styles.brand} aria-label={t('appName')}>
        <Logo decorative size={44} className={styles.logo} />
      </Link>
    </header>
  );
}
