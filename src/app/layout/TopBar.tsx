import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { IconButton, Logo } from '@/shared/ui';
import { AppMenu } from './AppMenu';
import styles from './TopBar.module.css';

export function TopBar() {
  const { t } = useTranslation();
  const { t: tNavigation } = useTranslation('navigation');
  const [open, setOpen] = useState(false);
  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <header className={styles.topBar}>
        <IconButton
          label={tNavigation('open')}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setOpen(true);
          }}
        >
          <span className={styles.menuIcon} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </IconButton>
        <Link to={routePaths.home} className={styles.brand} aria-label={t('appName')}>
          <Logo decorative size={48} className={styles.logo} />
        </Link>
      </header>
      <AppMenu open={open} onClose={close} />
    </>
  );
}
